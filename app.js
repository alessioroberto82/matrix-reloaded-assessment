// app.js — Application logic for Luscii Matrix Self-Assessment

// ===== STATE =====
let currentAssessment = {
    profileId: null,
    levelId: null,
    ratings: {},      // { "mastery_0": 4, "mastery_1": 3, ... }
    notes: {},         // { "mastery": "Some notes...", ... }
    startedAt: null
};

let currentDimensionIndex = 0;
let resultsChart = null;
let comparisonChart = null;
let selectedCompareIds = [];

// ===== DOM HELPERS =====
function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
        for (var key in attrs) {
            if (key === 'className') node.className = attrs[key];
            else if (key === 'textContent') node.textContent = attrs[key];
            else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
            else if (key === 'style' && typeof attrs[key] === 'object') {
                for (var s in attrs[key]) node.style[s] = attrs[key][s];
            }
            else node.setAttribute(key, attrs[key]);
        }
    }
    if (children) {
        if (!Array.isArray(children)) children = [children];
        for (var i = 0; i < children.length; i++) {
            if (typeof children[i] === 'string') node.appendChild(document.createTextNode(children[i]));
            else if (children[i]) node.appendChild(children[i]);
        }
    }
    return node;
}

function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    checkLocalStorageAvailable();
    renderLandingScreen();
    renderProfileCards();
});

function checkLocalStorageAvailable() {
    try {
        localStorage.setItem('_test', '1');
        localStorage.removeItem('_test');
    } catch (e) {
        document.getElementById('storage-warning').classList.remove('hidden');
    }
}

// ===== NAVIGATION =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.remove('active');
    });
    var screen = document.getElementById(screenId);
    screen.classList.add('active');
    window.scrollTo(0, 0);

    // Move focus to first heading or focusable element for accessibility
    var focusTarget = screen.querySelector('h1, h2, .step-indicator, [autofocus]');
    if (focusTarget) {
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
    }
}

function goToLanding() {
    renderLandingScreen();
    showScreen('screen-landing');
}

function goToProfile() {
    showScreen('screen-profile');
}

function goToLevel() {
    showScreen('screen-level');
}

function goToHistory() {
    renderHistoryList();
    showScreen('screen-history');
}

// ===== LANDING SCREEN =====
function renderLandingScreen() {
    var history = loadHistory();
    var inProgress = loadFromLocalStorage('lm_in_progress');

    document.getElementById('landing-first-visit').classList.add('hidden');
    document.getElementById('landing-returning').classList.add('hidden');
    document.getElementById('landing-resume').classList.add('hidden');

    if (inProgress) {
        document.getElementById('landing-resume').classList.remove('hidden');
        var profile = MATRIX_DATA.profiles[inProgress.profileId];
        var level = MATRIX_DATA.levels[inProgress.levelId];
        document.getElementById('resume-profile-info').textContent =
            profile.name + ' \u2014 ' + level.name;
    } else if (history.length > 0) {
        document.getElementById('landing-returning').classList.remove('hidden');
        var last = history[history.length - 1];
        var lastProfile = MATRIX_DATA.profiles[last.profileId];
        var lastLevel = MATRIX_DATA.levels[last.levelId];

        document.getElementById('last-assessment-date').textContent = formatDate(last.date);
        document.getElementById('last-assessment-profile').textContent = lastProfile.name;
        document.getElementById('last-assessment-level').textContent = lastLevel.name;

        renderScoreBars('last-assessment-bars', last.scores);
    } else {
        document.getElementById('landing-first-visit').classList.remove('hidden');
    }
}

function renderScoreBars(containerId, scores) {
    var container = document.getElementById(containerId);
    clearElement(container);
    var dims = MATRIX_DATA.dimensionOrder;
    for (var i = 0; i < dims.length; i++) {
        var dimId = dims[i];
        var dim = MATRIX_DATA.dimensions[dimId];
        var score = scores[dimId] || 0;
        var pct = (score / 5) * 100;

        var fill = el('div', { className: 'score-bar-fill', style: { width: pct + '%', background: dim.color } });
        var row = el('div', { className: 'score-bar-row' }, [
            el('span', { className: 'score-bar-label', textContent: dim.name }),
            el('div', { className: 'score-bar-track' }, [fill]),
            el('span', { className: 'score-bar-value', textContent: score.toFixed(1) })
        ]);
        container.appendChild(row);
    }
}

function resumeAssessment() {
    var saved = loadFromLocalStorage('lm_in_progress');
    if (!saved) return;
    currentAssessment = saved;
    currentDimensionIndex = 0;
    var dims = MATRIX_DATA.dimensionOrder;
    for (var i = 0; i < dims.length; i++) {
        var stmts = getStatements(currentAssessment.profileId, currentAssessment.levelId, dims[i]);
        var allRated = true;
        for (var j = 0; j < stmts.length; j++) {
            if (currentAssessment.ratings[dims[i] + '_' + j] === undefined) {
                allRated = false;
                break;
            }
        }
        if (!allRated) {
            currentDimensionIndex = i;
            break;
        }
        if (i === dims.length - 1) {
            currentDimensionIndex = dims.length - 1;
        }
    }
    showAssessmentScreen();
}

function discardAndStart() {
    saveToLocalStorage('lm_in_progress', null);
    goToProfile();
}

// ===== PROFILE SELECTION =====
function renderProfileCards() {
    var container = document.getElementById('profile-cards');
    clearElement(container);
    var profileIds = Object.keys(MATRIX_DATA.profiles);
    for (var i = 0; i < profileIds.length; i++) {
        var id = profileIds[i];
        var p = MATRIX_DATA.profiles[id];
        var card = el('div', {
            className: 'profile-card',
            role: 'button',
            tabindex: '0',
            'aria-label': p.name + ': ' + p.coreContribution,
            'data-profile-id': id
        }, [
            el('span', { className: 'profile-icon', textContent: p.icon }),
            el('div', { className: 'profile-card-name', textContent: p.name }),
            el('div', { className: 'profile-card-desc', textContent: p.scope })
        ]);
        (function(profileId) {
            card.addEventListener('click', function() { showProfileDetail(profileId); });
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showProfileDetail(profileId);
                }
            });
        })(id);
        container.appendChild(card);
    }
}

function showProfileDetail(profileId) {
    var p = MATRIX_DATA.profiles[profileId];
    document.getElementById('detail-icon').textContent = p.icon;
    document.getElementById('detail-name').textContent = p.name;
    document.getElementById('detail-name-dutch').textContent = p.nameDutch;
    document.getElementById('detail-contribution').textContent = p.coreContribution;
    document.getElementById('detail-problem-type').textContent = p.problemType;
    document.getElementById('detail-characteristics').textContent = p.characteristics.join('; ');
    document.getElementById('detail-added-value').textContent = p.addedValue;

    document.querySelectorAll('.profile-card').forEach(function(c) {
        c.classList.toggle('selected', c.getAttribute('data-profile-id') === profileId);
    });

    var btn = document.getElementById('btn-select-profile');
    btn.onclick = function() { selectProfile(profileId); };

    document.getElementById('profile-detail').classList.remove('hidden');
}

function closeProfileDetail() {
    document.getElementById('profile-detail').classList.add('hidden');
    document.querySelectorAll('.profile-card').forEach(function(c) {
        c.classList.remove('selected');
    });
}

function selectProfile(profileId) {
    currentAssessment.profileId = profileId;
    saveToLocalStorage('lm_profile', profileId);
    renderLevelOptions(profileId);
    showScreen('screen-level');
}

// ===== LEVEL SELECTION =====
function renderLevelOptions(profileId) {
    var profile = MATRIX_DATA.profiles[profileId];
    document.getElementById('level-profile-name').textContent = profile.name;

    var container = document.getElementById('level-options');
    clearElement(container);

    var legend = el('legend', { className: 'sr-only', textContent: 'Select your growth level' });
    container.appendChild(legend);

    var available = profile.availableLevels;
    var allLevels = ['junior', 'medior', 'core', 'master'];

    for (var i = 0; i < allLevels.length; i++) {
        var levelId = allLevels[i];
        if (available.indexOf(levelId) === -1) continue;

        var level = MATRIX_DATA.levels[levelId];
        var timeline = MATRIX_DATA.progressionTimeline[profileId][levelId];
        var isSelected = currentAssessment.levelId === levelId;

        var radio = el('input', {
            type: 'radio',
            name: 'level',
            id: 'level-' + levelId,
            value: levelId
        });
        if (isSelected) radio.checked = true;

        var content = el('div', { className: 'level-option-content' }, [
            el('span', { className: 'level-option-name', textContent: level.name }),
            el('span', { className: 'level-option-desc', textContent: level.description })
        ]);

        if (timeline) {
            content.appendChild(el('span', { className: 'level-option-timeline', textContent: 'Typical: ' + timeline }));
        }

        var label = el('label', {
            className: 'level-option' + (isSelected ? ' selected' : ''),
            'for': 'level-' + levelId
        }, [radio, content]);

        (function(lid) {
            radio.addEventListener('change', function() { selectLevel(lid); });
        })(levelId);

        container.appendChild(label);
    }

    updateContinueButton();
}

function selectLevel(levelId) {
    currentAssessment.levelId = levelId;
    saveToLocalStorage('lm_level', levelId);

    document.querySelectorAll('.level-option').forEach(function(opt) {
        var input = opt.querySelector('input');
        opt.classList.toggle('selected', input && input.value === levelId);
    });

    updateContinueButton();
}

function updateContinueButton() {
    document.getElementById('btn-continue-assessment').disabled = !currentAssessment.levelId;
}

// ===== ASSESSMENT =====
function startAssessment() {
    currentAssessment.ratings = {};
    currentAssessment.notes = {};
    currentAssessment.startedAt = new Date().toISOString();
    currentDimensionIndex = 0;
    saveInProgressAssessment();
    showAssessmentScreen();
}

function showAssessmentScreen() {
    showScreen('screen-assessment');
    renderDimensionAssessment();
}

function renderDimensionAssessment() {
    var dims = MATRIX_DATA.dimensionOrder;
    var dimId = dims[currentDimensionIndex];
    var dim = MATRIX_DATA.dimensions[dimId];
    var profile = MATRIX_DATA.profiles[currentAssessment.profileId];
    var level = MATRIX_DATA.levels[currentAssessment.levelId];

    // Context
    document.getElementById('assessment-context').textContent =
        profile.name + ' \u2022 ' + level.name;

    // Back button
    var backBtn = document.getElementById('btn-assessment-back');
    if (currentDimensionIndex === 0) {
        backBtn.onclick = function() { goToLevel(); };
    } else {
        backBtn.onclick = function() { prevDimension(); };
    }

    // Progress dots
    renderDimensionProgress(currentDimensionIndex);

    // Dimension header
    var dimName = document.getElementById('dimension-name');
    dimName.textContent = dim.name;
    dimName.style.color = dim.color;
    document.getElementById('dimension-description').textContent = dim.longDescription;
    document.querySelector('.dimension-header').style.borderLeftColor = dim.color;

    // Statements
    var statements = getStatements(currentAssessment.profileId, currentAssessment.levelId, dimId);
    var container = document.getElementById('statements-container');
    clearElement(container);

    for (var i = 0; i < statements.length; i++) {
        var ratingKey = dimId + '_' + i;
        var currentRating = currentAssessment.ratings[ratingKey];

        var optionsDiv = el('div', { className: 'rating-options' });
        for (var v = 1; v <= 5; v++) {
            var radioInput = el('input', {
                type: 'radio',
                name: 'rating-' + ratingKey,
                id: 'r-' + ratingKey + '-' + v,
                value: String(v)
            });
            if (currentRating === v) radioInput.checked = true;

            var radioLabel = el('label', { 'for': 'r-' + ratingKey + '-' + v, textContent: String(v) });

            (function(key, val) {
                radioInput.addEventListener('change', function() {
                    rateStatement(key, val);
                });
            })(ratingKey, v);

            optionsDiv.appendChild(el('div', { className: 'rating-option' }, [radioInput, radioLabel]));
        }

        var scaleDiv = el('div', { className: 'rating-scale' }, [
            el('span', { className: 'rating-label-min', textContent: 'Not yet' }),
            optionsDiv,
            el('span', { className: 'rating-label-max', textContent: 'Consistently' })
        ]);

        var card = el('div', { className: 'statement-card' }, [
            el('p', { className: 'statement-text', textContent: '\u201C' + statements[i] + '\u201D' }),
            scaleDiv
        ]);

        // Show evidence examples if any exist
        var examples = getEvidenceForStatement(currentAssessment.profileId, currentAssessment.levelId, dimId, i);
        if (examples.length > 0) {
            var previewDiv = el('div', { className: 'statement-evidence-preview' });
            var toggle = el('div', { className: 'statement-evidence-count',
                textContent: examples.length + ' example' + (examples.length !== 1 ? 's' : '') + ' collected \u2014 tap to view' });
            var detailDiv = el('div', { className: 'hidden' });
            for (var e = 0; e < examples.length; e++) {
                detailDiv.appendChild(el('div', { className: 'journal-example' }, [
                    el('div', { className: 'journal-example-date', textContent: formatDate(examples[e].date) }),
                    el('div', { className: 'journal-example-text', textContent: examples[e].text })
                ]));
            }
            toggle.addEventListener('click', function() {
                var detail = this.nextElementSibling;
                if (detail.classList.contains('hidden')) {
                    detail.classList.remove('hidden');
                    this.textContent = this.textContent.replace('tap to view', 'tap to hide');
                } else {
                    detail.classList.add('hidden');
                    this.textContent = this.textContent.replace('tap to hide', 'tap to view');
                }
            });
            previewDiv.appendChild(toggle);
            previewDiv.appendChild(detailDiv);
            card.appendChild(previewDiv);
        }

        container.appendChild(card);
    }

    // Notes
    var notesTextarea = document.getElementById('dimension-notes');
    notesTextarea.value = currentAssessment.notes[dimId] || '';
    notesTextarea.classList.add('hidden');
    document.getElementById('btn-toggle-notes').textContent = 'Add notes (optional)';

    if (currentAssessment.notes[dimId]) {
        notesTextarea.classList.remove('hidden');
        document.getElementById('btn-toggle-notes').textContent = 'Hide notes';
    }

    notesTextarea.onblur = function() {
        currentAssessment.notes[dimId] = this.value;
        saveInProgressAssessment();
    };

    // Next button text
    var nextBtn = document.getElementById('btn-next-dimension');
    if (currentDimensionIndex === dims.length - 1) {
        nextBtn.textContent = 'See Results \u2192';
    } else {
        var nextDim = MATRIX_DATA.dimensions[dims[currentDimensionIndex + 1]];
        nextBtn.textContent = 'Next: ' + nextDim.name + ' \u2192';
    }

    window.scrollTo(0, 0);
}

function renderDimensionProgress(activeIndex) {
    var container = document.getElementById('dimension-progress');
    clearElement(container);
    var dims = MATRIX_DATA.dimensionOrder;

    for (var i = 0; i < dims.length; i++) {
        if (i > 0) {
            container.appendChild(el('div', { className: 'dim-dot-connector' }));
        }
        var cls = 'dim-dot';
        if (i === activeIndex) cls += ' active';
        else if (i < activeIndex) cls += ' completed';
        container.appendChild(el('div', { className: cls, title: MATRIX_DATA.dimensions[dims[i]].name }));
    }
}

function getStatements(profileId, levelId, dimensionId) {
    var key = profileId + '_' + levelId + '_' + dimensionId;
    var stmts = MATRIX_DATA.statements[key];
    if (stmts) return stmts;
    console.warn('Missing statements for:', key);
    return [MATRIX_DATA.dimensions[dimensionId].longDescription];
}

function rateStatement(ratingKey, value) {
    currentAssessment.ratings[ratingKey] = value;
    saveInProgressAssessment();
}

function toggleNotes() {
    var textarea = document.getElementById('dimension-notes');
    var btn = document.getElementById('btn-toggle-notes');
    if (textarea.classList.contains('hidden')) {
        textarea.classList.remove('hidden');
        btn.textContent = 'Hide notes';
        textarea.focus();
    } else {
        textarea.classList.add('hidden');
        btn.textContent = 'Add notes (optional)';
    }
}

function prevDimension() {
    if (currentDimensionIndex > 0) {
        var dimId = MATRIX_DATA.dimensionOrder[currentDimensionIndex];
        currentAssessment.notes[dimId] = document.getElementById('dimension-notes').value;
        saveInProgressAssessment();
        currentDimensionIndex--;
        renderDimensionAssessment();
    }
}

function nextDimension() {
    var dims = MATRIX_DATA.dimensionOrder;
    var dimId = dims[currentDimensionIndex];
    currentAssessment.notes[dimId] = document.getElementById('dimension-notes').value;
    saveInProgressAssessment();

    if (currentDimensionIndex < dims.length - 1) {
        currentDimensionIndex++;
        renderDimensionAssessment();
    } else {
        goToResults();
    }
}

// ===== RESULTS =====
function goToResults() {
    var scores = calculateAllScores();
    var profile = MATRIX_DATA.profiles[currentAssessment.profileId];
    var level = MATRIX_DATA.levels[currentAssessment.levelId];

    document.getElementById('results-context').textContent =
        profile.name + ' \u2022 ' + level.name + ' \u2022 ' + formatDate(new Date().toISOString());

    renderRadarChart(scores);
    renderScoreSummary(scores);
    renderNarrative(currentAssessment.profileId, currentAssessment.levelId, scores);
    renderGrowthSuggestions(currentAssessment.profileId, currentAssessment.levelId, scores);

    var history = loadHistory();
    var compareBtn = document.getElementById('btn-compare');
    if (history.length > 0) {
        compareBtn.classList.remove('hidden');
    } else {
        compareBtn.classList.add('hidden');
    }

    showScreen('screen-results');
}

function calculateAllScores() {
    var scores = {};
    var dims = MATRIX_DATA.dimensionOrder;
    for (var i = 0; i < dims.length; i++) {
        scores[dims[i]] = calculateDimensionScore(dims[i]);
    }
    return scores;
}

function calculateDimensionScore(dimensionId) {
    var statements = getStatements(currentAssessment.profileId, currentAssessment.levelId, dimensionId);
    var total = 0;
    var count = 0;
    for (var i = 0; i < statements.length; i++) {
        var key = dimensionId + '_' + i;
        if (currentAssessment.ratings[key] !== undefined) {
            total += currentAssessment.ratings[key];
            count++;
        }
    }
    if (count === 0) return 0;
    return Math.round((total / count) * 10) / 10;
}

function renderRadarChart(scores, comparisonScores) {
    var dims = MATRIX_DATA.dimensionOrder;
    var labels = dims.map(function(d) {
        return MATRIX_DATA.dimensions[d].name + ' (' + (scores[d] || 0).toFixed(1) + ')';
    });
    var data = dims.map(function(d) { return scores[d] || 0; });
    var colors = dims.map(function(d) { return MATRIX_DATA.dimensions[d].color; });

    // Baseline dataset: expected level threshold (3.5 = "Solid" minimum)
    var baselineValue = 3.5;
    var baselineData = dims.map(function() { return baselineValue; });

    var datasets = [
        {
            label: 'Expected (' + baselineValue + ')',
            data: baselineData,
            backgroundColor: 'transparent',
            borderColor: 'rgba(0, 0, 0, 0.15)',
            borderWidth: 1,
            borderDash: [4, 4],
            pointRadius: 0,
            pointHitRadius: 0
        },
        {
            label: 'Current',
            data: data,
            backgroundColor: 'rgba(26, 92, 92, 0.15)',
            borderColor: 'rgba(26, 92, 92, 0.8)',
            borderWidth: 2,
            pointBackgroundColor: colors,
            pointBorderColor: colors,
            pointRadius: 5
        }
    ];

    if (comparisonScores) {
        var compData = dims.map(function(d) { return comparisonScores[d] || 0; });
        datasets.push({
            label: 'Previous',
            data: compData,
            backgroundColor: 'rgba(212, 168, 83, 0.1)',
            borderColor: 'rgba(212, 168, 83, 0.6)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: 'rgba(212, 168, 83, 0.8)',
            pointRadius: 4
        });
    }

    var ctx = document.getElementById('results-chart').getContext('2d');
    if (resultsChart) resultsChart.destroy();

    resultsChart = new Chart(ctx, {
        type: 'radar',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    min: 0, max: 5,
                    ticks: { stepSize: 1, display: true, font: { size: 10 } },
                    pointLabels: { font: { size: 12, weight: '600' } },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                }
            },
            plugins: {
                legend: { display: true, position: 'bottom' }
            },
            animation: { duration: 800 }
        }
    });
}

function renderScoreSummary(scores) {
    var container = document.getElementById('score-summary');
    clearElement(container);
    var dims = MATRIX_DATA.dimensionOrder;

    for (var i = 0; i < dims.length; i++) {
        var dimId = dims[i];
        var dim = MATRIX_DATA.dimensions[dimId];
        var score = scores[dimId] || 0;
        var interp = getScoreInterpretation(score);

        var card = el('div', { className: 'score-card', style: { borderTopColor: dim.color } }, [
            el('div', { className: 'score-card-label', textContent: dim.name }),
            el('div', { className: 'score-card-value', textContent: score.toFixed(1), style: { color: dim.color } }),
            el('div', { className: 'score-card-interpretation', textContent: interp.label })
        ]);
        container.appendChild(card);
    }
}

function getScoreInterpretation(score) {
    var labels = MATRIX_DATA.scoreLabels;
    if (score >= labels.strong.min) return labels.strong;
    if (score >= labels.solid.min) return labels.solid;
    if (score >= labels.developing.min) return labels.developing;
    return labels.emerging;
}

// ===== NARRATIVE =====
function renderNarrative(profileId, levelId, scores) {
    var container = document.getElementById('narrative-section');
    clearElement(container);
    var dims = MATRIX_DATA.dimensionOrder;
    var profile = MATRIX_DATA.profiles[profileId];
    var level = MATRIX_DATA.levels[levelId];

    // Find strongest and weakest
    var strongest = dims[0];
    var weakest = dims[0];
    for (var i = 1; i < dims.length; i++) {
        if (scores[dims[i]] > scores[strongest]) strongest = dims[i];
        if (scores[dims[i]] < scores[weakest]) weakest = dims[i];
    }

    // M+A vs I+O
    var maAvg = ((scores.mastery || 0) + (scores.autonomy || 0)) / 2;
    var ioAvg = ((scores.impact || 0) + (scores.ownership || 0)) / 2;

    container.appendChild(el('h3', { textContent: 'Narrative Summary' }));

    // Profile context
    var contextText = 'As a ' + profile.name + ' at ' + level.name + ' level, you are expected to ' +
        MATRIX_DATA.levelExpectations[levelId] + '.';
    container.appendChild(el('p', { textContent: contextText }));

    // Strongest dimension
    var strongText = 'Your strongest dimension is ' + MATRIX_DATA.dimensions[strongest].name +
        ' (' + scores[strongest].toFixed(1) + ') \u2014 ' + getScoreInterpretation(scores[strongest]).description + '.';
    var strongP = el('p');
    strongP.appendChild(document.createTextNode('Your strongest dimension is '));
    strongP.appendChild(el('strong', { textContent: MATRIX_DATA.dimensions[strongest].name }));
    strongP.appendChild(document.createTextNode(' (' + scores[strongest].toFixed(1) + ') \u2014 ' +
        getScoreInterpretation(scores[strongest]).description + '.'));
    container.appendChild(strongP);

    // Weakest dimension
    if (weakest !== strongest) {
        var weakP = el('p');
        weakP.appendChild(document.createTextNode('Your growth opportunity is in '));
        weakP.appendChild(el('strong', { textContent: MATRIX_DATA.dimensions[weakest].name }));
        weakP.appendChild(document.createTextNode(' (' + scores[weakest].toFixed(1) + ') \u2014 ' +
            getScoreInterpretation(scores[weakest]).description + '.'));
        container.appendChild(weakP);
    }

    // Natural development order
    if (maAvg >= ioAvg + 0.3) {
        container.appendChild(el('p', {
            textContent: 'Your Mastery and Autonomy scores (' + scores.mastery.toFixed(1) + ', ' +
                scores.autonomy.toFixed(1) + ') are stronger than Impact and Ownership (' +
                scores.impact.toFixed(1) + ', ' + scores.ownership.toFixed(1) +
                '). This is consistent with the natural development order in Matrix Reloaded \u2014 foundation first, then influence.'
        }));
    } else if (ioAvg >= maAvg + 0.3) {
        container.appendChild(el('p', {
            textContent: 'Your Impact and Ownership scores (' + scores.impact.toFixed(1) + ', ' +
                scores.ownership.toFixed(1) + ') are higher than Mastery and Autonomy (' +
                scores.mastery.toFixed(1) + ', ' + scores.autonomy.toFixed(1) +
                '). This is an unusual pattern \u2014 consider strengthening your foundations to sustain your influence.'
        }));
    }

    // Level readiness
    var allAbove35 = true;
    var allAbove40 = true;
    var anyBelow25 = false;
    for (var j = 0; j < dims.length; j++) {
        if (scores[dims[j]] < 3.5) allAbove35 = false;
        if (scores[dims[j]] < 4.0) allAbove40 = false;
        if (scores[dims[j]] < 2.5) anyBelow25 = true;
    }

    if (allAbove40) {
        container.appendChild(el('p', {
            textContent: 'All dimensions are strong. Consider how Master-level behaviours \u2014 coaching, knowledge transfer, and organisational influence \u2014 can be your next growth area.'
        }));
    } else if (allAbove35) {
        container.appendChild(el('p', {
            textContent: 'Your scores suggest readiness for the next level. All dimensions are at 3.5 or above.'
        }));
    } else if (anyBelow25) {
        var deepenP = el('p');
        deepenP.appendChild(document.createTextNode('Focus on strengthening '));
        deepenP.appendChild(el('strong', { textContent: MATRIX_DATA.dimensions[weakest].name }));
        deepenP.appendChild(document.createTextNode(' at your current level before considering the next step.'));
        container.appendChild(deepenP);
    }
}

// ===== GROWTH SUGGESTIONS =====
function renderGrowthSuggestions(profileId, levelId, scores) {
    var container = document.getElementById('growth-section');
    clearElement(container);
    var dims = MATRIX_DATA.dimensionOrder;

    var deepenItems = [];
    var prepareItems = [];

    for (var i = 0; i < dims.length; i++) {
        var dimId = dims[i];
        var score = scores[dimId] || 0;
        if (score >= 4.5) continue;

        var range = score < 2.5 ? 'low' : (score < 3.5 ? 'medium' : 'high');
        var key = profileId + '_' + dimId + '_' + range;
        var suggestions = MATRIX_DATA.growthSuggestions[key] || [];

        if (score < 3.5) {
            for (var j = 0; j < suggestions.length; j++) {
                deepenItems.push({ dimension: MATRIX_DATA.dimensions[dimId].name, text: suggestions[j] });
            }
        } else {
            for (var k = 0; k < suggestions.length; k++) {
                prepareItems.push({ dimension: MATRIX_DATA.dimensions[dimId].name, text: suggestions[k] });
            }
        }
    }

    // Cross-dimension insight
    if (scores.mastery < 3.0 && scores.ownership > 3.5) {
        deepenItems.unshift({
            dimension: 'Cross-dimension',
            text: 'Consider strengthening Mastery first \u2014 it enables sustainable Ownership.'
        });
    }

    if (deepenItems.length === 0 && prepareItems.length === 0) {
        container.appendChild(el('div', { className: 'growth-category' }, [
            el('div', { className: 'growth-category-title', textContent: 'All dimensions strong' }),
            el('p', {
                textContent: 'All your dimensions are at or near maximum. Focus on Master-level behaviours: coaching others, transferring knowledge, and expanding your influence across the organisation.',
                style: { fontSize: '0.9rem', lineHeight: '1.5' }
            })
        ]));
    }
    if (deepenItems.length > 0) {
        container.appendChild(renderGrowthCategory('Deepen Current Level', deepenItems));
    }
    if (prepareItems.length > 0) {
        container.appendChild(renderGrowthCategory('Prepare for Next Level', prepareItems));
    }
}

function renderGrowthCategory(title, items) {
    var category = el('div', { className: 'growth-category' }, [
        el('div', { className: 'growth-category-title', textContent: title })
    ]);
    for (var i = 0; i < items.length; i++) {
        var itemDiv = el('div', { className: 'growth-item' }, [
            el('span', null, [
                el('strong', { textContent: items[i].dimension + ': ' }),
                document.createTextNode(items[i].text)
            ])
        ]);
        category.appendChild(itemDiv);
    }
    return category;
}

// ===== SAVE & FINISH =====
function saveAndFinish() {
    var scores = calculateAllScores();
    var assessment = {
        id: generateId(),
        profileId: currentAssessment.profileId,
        levelId: currentAssessment.levelId,
        date: new Date().toISOString(),
        scores: scores,
        ratings: Object.assign({}, currentAssessment.ratings),
        notes: Object.assign({}, currentAssessment.notes)
    };

    saveAssessment(assessment);
    saveToLocalStorage('lm_in_progress', null);

    currentAssessment = {
        profileId: null,
        levelId: null,
        ratings: {},
        notes: {},
        startedAt: null
    };

    goToLanding();
}

function goToCompare() {
    goToHistory();
}

// ===== HISTORY =====
function renderHistoryList() {
    var history = loadHistory();
    var listContainer = document.getElementById('history-list');
    var emptyContainer = document.getElementById('history-empty');
    var compSection = document.getElementById('comparison-section');

    compSection.classList.add('hidden');
    selectedCompareIds = [];

    if (history.length === 0) {
        clearElement(listContainer);
        emptyContainer.classList.remove('hidden');
        return;
    }

    emptyContainer.classList.add('hidden');
    clearElement(listContainer);

    for (var i = history.length - 1; i >= 0; i--) {
        var a = history[i];
        var profile = MATRIX_DATA.profiles[a.profileId];
        var level = MATRIX_DATA.levels[a.levelId];
        var dims = MATRIX_DATA.dimensionOrder;

        var scoresDiv = el('div', { className: 'history-scores' });
        for (var j = 0; j < dims.length; j++) {
            var dimId = dims[j];
            var abbrev = MATRIX_DATA.dimensions[dimId].name.charAt(0);
            scoresDiv.appendChild(el('span', { className: 'history-score-item' }, [
                el('span', { className: 'history-score-label', textContent: abbrev + ': ' }),
                document.createTextNode((a.scores[dimId] || 0).toFixed(1))
            ]));
        }

        var viewBtn = el('button', { className: 'btn-small', textContent: 'View' });
        var compareBtn = el('button', { className: 'btn-small', textContent: 'Compare' });
        var deleteBtn = el('button', { className: 'btn-small', textContent: 'Delete' });

        (function(aid) {
            viewBtn.addEventListener('click', function() { viewAssessment(aid); });
            compareBtn.addEventListener('click', function() { toggleCompare(this, aid); });
            deleteBtn.addEventListener('click', function() { deleteAssessment(aid); });
        })(a.id);

        var item = el('div', { className: 'history-item' }, [
            el('div', { className: 'history-item-header' }, [
                el('span', { className: 'history-item-date', textContent: formatDate(a.date) }),
                el('span', { className: 'history-item-profile', textContent: profile.name + ' \u2022 ' + level.name })
            ]),
            scoresDiv,
            el('div', { className: 'history-item-actions' }, [viewBtn, compareBtn, deleteBtn])
        ]);

        listContainer.appendChild(item);
    }
}

function viewAssessment(assessmentId) {
    var history = loadHistory();
    var assessment = null;
    for (var i = 0; i < history.length; i++) {
        if (history[i].id === assessmentId) { assessment = history[i]; break; }
    }
    if (!assessment) return;

    currentAssessment.profileId = assessment.profileId;
    currentAssessment.levelId = assessment.levelId;
    currentAssessment.ratings = assessment.ratings;
    currentAssessment.notes = assessment.notes;

    goToResults();
}

function toggleCompare(btn, id) {
    var idx = selectedCompareIds.indexOf(id);

    if (idx !== -1) {
        selectedCompareIds.splice(idx, 1);
        btn.classList.remove('active');
    } else {
        if (selectedCompareIds.length >= 2) {
            var allBtns = document.querySelectorAll('.btn-small.active');
            if (allBtns.length > 0) allBtns[0].classList.remove('active');
            selectedCompareIds.shift();
        }
        selectedCompareIds.push(id);
        btn.classList.add('active');
    }

    if (selectedCompareIds.length === 2) {
        showComparison(selectedCompareIds[0], selectedCompareIds[1]);
    } else {
        document.getElementById('comparison-section').classList.add('hidden');
    }
}

function showComparison(id1, id2) {
    var history = loadHistory();
    var a1 = null, a2 = null;
    for (var i = 0; i < history.length; i++) {
        if (history[i].id === id1) a1 = history[i];
        if (history[i].id === id2) a2 = history[i];
    }
    if (!a1 || !a2) return;

    // Ensure a1 is older
    if (new Date(a1.date) > new Date(a2.date)) {
        var tmp = a1; a1 = a2; a2 = tmp;
    }

    var dims = MATRIX_DATA.dimensionOrder;
    var labels = dims.map(function(d) { return MATRIX_DATA.dimensions[d].name; });
    var data1 = dims.map(function(d) { return a1.scores[d] || 0; });
    var data2 = dims.map(function(d) { return a2.scores[d] || 0; });

    var ctx = document.getElementById('comparison-chart').getContext('2d');
    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: formatDate(a1.date),
                    data: data1,
                    backgroundColor: 'rgba(212, 168, 83, 0.1)',
                    borderColor: 'rgba(212, 168, 83, 0.7)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 4
                },
                {
                    label: formatDate(a2.date),
                    data: data2,
                    backgroundColor: 'rgba(26, 92, 92, 0.15)',
                    borderColor: 'rgba(26, 92, 92, 0.8)',
                    borderWidth: 2,
                    pointRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    min: 0, max: 5,
                    ticks: { stepSize: 1, font: { size: 10 } },
                    pointLabels: { font: { size: 12, weight: '600' } },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                }
            },
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });

    // Render deltas
    var deltaContainer = document.getElementById('comparison-deltas');
    clearElement(deltaContainer);

    for (var j = 0; j < dims.length; j++) {
        var dimId = dims[j];
        var dim = MATRIX_DATA.dimensions[dimId];
        var delta = (a2.scores[dimId] || 0) - (a1.scores[dimId] || 0);
        var sign = delta > 0 ? '+' : '';
        var cls = delta > 0.05 ? 'positive' : (delta < -0.05 ? 'negative' : 'neutral');

        deltaContainer.appendChild(el('div', { className: 'delta-card' }, [
            el('div', { className: 'delta-label', textContent: dim.name }),
            el('div', { className: 'delta-value ' + cls, textContent: sign + delta.toFixed(1) })
        ]));
    }

    document.getElementById('comparison-section').classList.remove('hidden');
}

function closeComparison() {
    document.getElementById('comparison-section').classList.add('hidden');
    selectedCompareIds = [];
    document.querySelectorAll('.btn-small.active').forEach(function(btn) {
        btn.classList.remove('active');
    });
}

function deleteAssessment(assessmentId) {
    if (!confirm('Delete this assessment? This cannot be undone.')) return;
    var history = loadHistory();
    history = history.filter(function(a) { return a.id !== assessmentId; });
    saveToLocalStorage('lm_history', history);
    renderHistoryList();
}

// ===== PERSISTENCE =====
function saveToLocalStorage(key, data) {
    try {
        if (data === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(data));
        }
    } catch (e) {
        console.warn('localStorage write failed:', e);
    }
}

function loadFromLocalStorage(key) {
    try {
        var raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.warn('localStorage read failed:', e);
        return null;
    }
}

function saveAssessment(assessment) {
    var history = loadHistory();
    history.push(assessment);
    saveToLocalStorage('lm_history', history);
}

function loadHistory() {
    return loadFromLocalStorage('lm_history') || [];
}

function saveInProgressAssessment() {
    saveToLocalStorage('lm_in_progress', currentAssessment);
}

// ===== UTILITIES =====
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(isoString) {
    var d = new Date(isoString);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// ===== EVIDENCE JOURNAL =====
var journalProfileId = null;
var journalLevelId = null;
var journalExpandedDims = {};

function loadEvidence() {
    return loadFromLocalStorage('lm_evidence') || {};
}

function saveEvidence(evidence) {
    saveToLocalStorage('lm_evidence', evidence);
}

function getEvidenceKey(profileId, levelId, dimId, stmtIndex) {
    return profileId + '_' + levelId + '_' + dimId + '_' + stmtIndex;
}

function getEvidenceForStatement(profileId, levelId, dimId, stmtIndex) {
    var evidence = loadEvidence();
    var key = getEvidenceKey(profileId, levelId, dimId, stmtIndex);
    return evidence[key] || [];
}

function countEvidenceForDimension(profileId, levelId, dimId) {
    var evidence = loadEvidence();
    var statements = getStatements(profileId, levelId, dimId);
    var count = 0;
    for (var i = 0; i < statements.length; i++) {
        var key = getEvidenceKey(profileId, levelId, dimId, i);
        if (evidence[key] && evidence[key].length > 0) count += evidence[key].length;
    }
    return count;
}

function goToJournal() {
    // Default to last used profile/level or first available
    var lastProfile = loadFromLocalStorage('lm_profile');
    var lastLevel = loadFromLocalStorage('lm_level');

    journalProfileId = lastProfile || Object.keys(MATRIX_DATA.profiles)[0];
    journalLevelId = lastLevel;

    renderJournalPicker();
    renderJournalDimensions();
    showScreen('screen-journal');
}

function renderJournalPicker() {
    var profileSelect = document.getElementById('journal-profile-select');
    clearElement(profileSelect);

    var profileIds = Object.keys(MATRIX_DATA.profiles);
    for (var i = 0; i < profileIds.length; i++) {
        var pid = profileIds[i];
        var p = MATRIX_DATA.profiles[pid];
        var opt = el('option', { value: pid, textContent: p.icon + ' ' + p.name });
        if (pid === journalProfileId) opt.selected = true;
        profileSelect.appendChild(opt);
    }

    renderJournalLevelOptions();
}

function renderJournalLevelOptions() {
    var levelSelect = document.getElementById('journal-level-select');
    clearElement(levelSelect);

    var profile = MATRIX_DATA.profiles[journalProfileId];
    var available = profile.availableLevels;

    // If current level not available for this profile, pick first
    if (available.indexOf(journalLevelId) === -1) {
        journalLevelId = available[0];
    }

    for (var i = 0; i < available.length; i++) {
        var lid = available[i];
        var level = MATRIX_DATA.levels[lid];
        var opt = el('option', { value: lid, textContent: level.name });
        if (lid === journalLevelId) opt.selected = true;
        levelSelect.appendChild(opt);
    }
}

function onJournalProfileChange() {
    journalProfileId = document.getElementById('journal-profile-select').value;
    renderJournalLevelOptions();
    renderJournalDimensions();
}

function onJournalLevelChange() {
    journalLevelId = document.getElementById('journal-level-select').value;
    renderJournalDimensions();
}

function renderJournalDimensions() {
    var container = document.getElementById('journal-dimensions');
    clearElement(container);

    if (!journalProfileId || !journalLevelId) return;

    var dims = MATRIX_DATA.dimensionOrder;
    for (var i = 0; i < dims.length; i++) {
        var dimId = dims[i];
        var dim = MATRIX_DATA.dimensions[dimId];
        var evidenceCount = countEvidenceForDimension(journalProfileId, journalLevelId, dimId);
        var isExpanded = journalExpandedDims[dimId] || false;

        var badge = el('span', {
            className: 'journal-dim-badge' + (evidenceCount === 0 ? ' empty' : ''),
            textContent: evidenceCount + ' example' + (evidenceCount !== 1 ? 's' : '')
        });

        var header = el('div', {
            className: 'journal-dim-header',
            style: { borderLeftColor: dim.color }
        }, [
            el('span', { className: 'journal-dim-title', textContent: dim.name, style: { color: dim.color } }),
            badge
        ]);

        var body = el('div', { className: 'journal-dim-body' + (isExpanded ? '' : ' collapsed') });
        renderJournalStatements(body, dimId);

        (function(did) {
            header.addEventListener('click', function() {
                journalExpandedDims[did] = !journalExpandedDims[did];
                renderJournalDimensions();
            });
        })(dimId);

        var section = el('div', { className: 'journal-dim-section' }, [header, body]);
        container.appendChild(section);
    }
}

function renderJournalStatements(container, dimId) {
    var statements = getStatements(journalProfileId, journalLevelId, dimId);

    for (var i = 0; i < statements.length; i++) {
        var stmtDiv = el('div', { className: 'journal-statement' });
        stmtDiv.appendChild(el('p', { className: 'journal-statement-text', textContent: '\u201C' + statements[i] + '\u201D' }));

        // Existing examples
        var examples = getEvidenceForStatement(journalProfileId, journalLevelId, dimId, i);
        if (examples.length > 0) {
            var examplesDiv = el('div', { className: 'journal-examples' });
            for (var j = 0; j < examples.length; j++) {
                examplesDiv.appendChild(renderJournalExample(dimId, i, j, examples[j]));
            }
            stmtDiv.appendChild(examplesDiv);
        }

        // Add button / form
        stmtDiv.appendChild(renderJournalAddButton(dimId, i));

        container.appendChild(stmtDiv);
    }
}

function renderJournalExample(dimId, stmtIndex, exampleIndex, example) {
    var actionsDiv = el('div', { className: 'journal-example-actions' });

    var editBtn = el('button', { textContent: 'Edit' });
    var deleteBtn = el('button', { className: 'delete', textContent: 'Delete' });

    (function(did, si, ei) {
        editBtn.addEventListener('click', function() { editJournalExample(did, si, ei); });
        deleteBtn.addEventListener('click', function() { deleteJournalExample(did, si, ei); });
    })(dimId, stmtIndex, exampleIndex);

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    return el('div', {
        className: 'journal-example',
        'data-dim': dimId,
        'data-stmt': String(stmtIndex),
        'data-example': String(exampleIndex)
    }, [
        el('div', { className: 'journal-example-date', textContent: formatDate(example.date) }),
        el('div', { className: 'journal-example-text', textContent: example.text }),
        actionsDiv
    ]);
}

function renderJournalAddButton(dimId, stmtIndex) {
    var btn = el('button', { className: 'journal-add-btn', textContent: '+ Add example' });
    (function(did, si) {
        btn.addEventListener('click', function() {
            var parent = this.parentNode;
            parent.replaceChild(renderJournalAddForm(did, si), this);
        });
    })(dimId, stmtIndex);
    return btn;
}

function renderJournalAddForm(dimId, stmtIndex) {
    var form = el('div', { className: 'journal-add-form' });
    var textarea = el('textarea', {
        placeholder: 'Describe a concrete example from your work...',
        rows: '3'
    });

    var saveBtn = el('button', { className: 'btn-save', textContent: 'Save' });
    var cancelBtn = el('button', { className: 'btn-cancel', textContent: 'Cancel' });

    (function(did, si) {
        saveBtn.addEventListener('click', function() {
            var text = textarea.value.trim();
            if (!text) return;
            addJournalExample(did, si, text);
        });
        cancelBtn.addEventListener('click', function() {
            renderJournalDimensions();
        });
    })(dimId, stmtIndex);

    var actions = el('div', { className: 'journal-add-form-actions' }, [cancelBtn, saveBtn]);
    form.appendChild(textarea);
    form.appendChild(actions);

    // Auto-focus
    setTimeout(function() { textarea.focus(); }, 50);

    return form;
}

function addJournalExample(dimId, stmtIndex, text) {
    var evidence = loadEvidence();
    var key = getEvidenceKey(journalProfileId, journalLevelId, dimId, stmtIndex);
    if (!evidence[key]) evidence[key] = [];
    var newIndex = evidence[key].length;
    evidence[key].push({
        id: generateId(),
        date: new Date().toISOString(),
        text: text
    });
    saveEvidence(evidence);
    renderJournalDimensions();
    flashJournalExample(dimId, stmtIndex, newIndex);
}

function editJournalExample(dimId, stmtIndex, exampleIndex) {
    var evidence = loadEvidence();
    var key = getEvidenceKey(journalProfileId, journalLevelId, dimId, stmtIndex);
    var examples = evidence[key] || [];
    var example = examples[exampleIndex];
    if (!example) return;

    // Re-render dimensions with this dimension expanded
    journalExpandedDims[dimId] = true;
    renderJournalDimensions();

    // Find the example by data attributes
    var selector = '.journal-example[data-dim="' + dimId + '"][data-stmt="' + stmtIndex + '"][data-example="' + exampleIndex + '"]';
    var exampleDiv = document.querySelector(selector);
    if (!exampleDiv) return;

    var form = el('div', { className: 'journal-add-form' });
    var textarea = el('textarea', { rows: '3' });
    textarea.value = example.text;

    var saveBtn = el('button', { className: 'btn-save', textContent: 'Save' });
    var cancelBtn = el('button', { className: 'btn-cancel', textContent: 'Cancel' });

    (function(did, si, ei) {
        saveBtn.addEventListener('click', function() {
            var text = textarea.value.trim();
            if (!text) return;
            var ev = loadEvidence();
            var k = getEvidenceKey(journalProfileId, journalLevelId, did, si);
            if (ev[k] && ev[k][ei]) {
                ev[k][ei].text = text;
                ev[k][ei].date = new Date().toISOString();
                saveEvidence(ev);
            }
            renderJournalDimensions();
            flashJournalExample(did, si, ei);
        });
        cancelBtn.addEventListener('click', function() {
            renderJournalDimensions();
        });
    })(dimId, stmtIndex, exampleIndex);

    var actions = el('div', { className: 'journal-add-form-actions' }, [cancelBtn, saveBtn]);
    form.appendChild(textarea);
    form.appendChild(actions);

    exampleDiv.parentNode.replaceChild(form, exampleDiv);
    setTimeout(function() { textarea.focus(); }, 50);
}

function deleteJournalExample(dimId, stmtIndex, exampleIndex) {
    if (!confirm('Delete this example?')) return;
    var evidence = loadEvidence();
    var key = getEvidenceKey(journalProfileId, journalLevelId, dimId, stmtIndex);
    if (evidence[key]) {
        evidence[key].splice(exampleIndex, 1);
        if (evidence[key].length === 0) delete evidence[key];
        saveEvidence(evidence);
    }
    renderJournalDimensions();
}

function flashJournalExample(dimId, stmtIndex, exampleIndex) {
    var selector = '.journal-example[data-dim="' + dimId + '"][data-stmt="' + stmtIndex + '"][data-example="' + exampleIndex + '"]';
    var node = document.querySelector(selector);
    if (node) node.classList.add('just-saved');
}
