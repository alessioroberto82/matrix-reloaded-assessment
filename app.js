// app.js — Application logic for Luscii Matrix Self-Assessment (v2)
// Rating system: Yes / Not yet / ? (percentage-based scoring)

// ===== STATE =====
var currentAssessment = {
    type: null,        // "profile" or "culture"
    profileId: null,
    levelId: null,
    ratings: {},       // { "mastery_0": "yes", "mastery_1": "not_yet", ... }
    comments: {},      // { "mastery_0": "Example text...", ... }
    startedAt: null
};

var currentDimensionIndex = 0;
var resultsChart = null;
var comparisonChart = null;
var selectedCompareIds = [];
var selectedCompareType = null;

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
    var inProgress = loadFromLocalStorage('lm2_in_progress');

    document.getElementById('landing-first-visit').classList.add('hidden');
    document.getElementById('landing-returning').classList.add('hidden');
    document.getElementById('landing-resume').classList.add('hidden');

    if (inProgress) {
        document.getElementById('landing-resume').classList.remove('hidden');
        var infoText = '';
        if (inProgress.type === 'culture') {
            infoText = 'Culture Score Assessment';
        } else {
            var profile = MATRIX_DATA.profiles[inProgress.profileId];
            var level = MATRIX_DATA.levels[inProgress.levelId];
            infoText = profile.name + ' \u2014 ' + level.name;
        }
        document.getElementById('resume-profile-info').textContent = infoText;
    } else if (history.length > 0) {
        document.getElementById('landing-returning').classList.remove('hidden');
        var last = history[history.length - 1];

        document.getElementById('last-assessment-date').textContent = formatDate(last.date);
        if (last.type === 'culture') {
            document.getElementById('last-assessment-profile').textContent = 'Culture Score';
        } else {
            var lastProfile = MATRIX_DATA.profiles[last.profileId];
            var lastLevel = MATRIX_DATA.levels[last.levelId];
            document.getElementById('last-assessment-profile').textContent =
                lastProfile.name + ' \u2014 ' + lastLevel.name;
        }

        renderScoreBars('last-assessment-bars', last);
    } else {
        document.getElementById('landing-first-visit').classList.remove('hidden');
    }
}

function renderScoreBars(containerId, assessment) {
    var container = document.getElementById(containerId);
    clearElement(container);

    var dims, scores;
    if (assessment.type === 'culture') {
        dims = MATRIX_DATA.cultureScore.cultureDimensionOrder;
        scores = assessment.scores;
    } else {
        dims = MATRIX_DATA.dimensionOrder;
        scores = assessment.scores;
    }

    for (var i = 0; i < dims.length; i++) {
        var dimId = dims[i];
        var dimName;
        if (assessment.type === 'culture') {
            dimName = MATRIX_DATA.cultureScore.dimensions[dimId] ?
                MATRIX_DATA.cultureScore.dimensions[dimId].name : 'Master';
        } else {
            dimName = MATRIX_DATA.dimensions[dimId].name;
        }
        var score = scores[dimId] || 0;
        var color = assessment.type === 'culture' ? 'var(--primary)' :
            MATRIX_DATA.dimensions[dimId].color;

        var fill = el('div', { className: 'score-bar-fill', style: { width: score + '%', background: color } });
        var row = el('div', { className: 'score-bar-row' }, [
            el('span', { className: 'score-bar-label', textContent: dimName }),
            el('div', { className: 'score-bar-track' }, [fill]),
            el('span', { className: 'score-bar-value', textContent: score + '%' })
        ]);
        container.appendChild(row);
    }
}

function resumeAssessment() {
    var saved = loadFromLocalStorage('lm2_in_progress');
    if (!saved) return;
    currentAssessment = saved;
    currentDimensionIndex = 0;

    var dims = getAssessmentDimensions();
    for (var i = 0; i < dims.length; i++) {
        var stmts = getStatementsForDimension(dims[i]);
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
    saveToLocalStorage('lm2_in_progress', null);
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
    saveToLocalStorage('lm2_profile', profileId);
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
        var timeline = MATRIX_DATA.progressionTimeline[profileId] ?
            MATRIX_DATA.progressionTimeline[profileId][levelId] : null;
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

        // Check if statements exist for this profile+level
        var hasStatements = !!MATRIX_DATA.statements[profileId + '_' + levelId + '_mastery'];
        if (!hasStatements) {
            content.appendChild(el('span', {
                className: 'level-option-timeline',
                textContent: 'No assessment data available',
                style: { color: 'var(--text-muted)' }
            }));
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
    saveToLocalStorage('lm2_level', levelId);

    document.querySelectorAll('.level-option').forEach(function(opt) {
        var input = opt.querySelector('input');
        opt.classList.toggle('selected', input && input.value === levelId);
    });

    updateContinueButton();
}

function updateContinueButton() {
    document.getElementById('btn-continue-assessment').disabled = !currentAssessment.levelId;
}

// ===== ASSESSMENT DIMENSIONS HELPER =====
function getAssessmentDimensions() {
    if (currentAssessment.type === 'culture') {
        var dims = MATRIX_DATA.cultureScore.cultureDimensionOrder.slice();
        dims.push('master');
        return dims;
    }
    return MATRIX_DATA.dimensionOrder;
}

function getStatementsForDimension(dimId) {
    if (currentAssessment.type === 'culture') {
        if (dimId === 'master') {
            return MATRIX_DATA.cultureScore.masterStatements;
        }
        return MATRIX_DATA.cultureScore.dimensions[dimId].statements;
    }
    return getStatements(currentAssessment.profileId, currentAssessment.levelId, dimId);
}

function getDimensionName(dimId) {
    if (currentAssessment.type === 'culture') {
        if (dimId === 'master') return 'Master Statements';
        return MATRIX_DATA.cultureScore.dimensions[dimId].name;
    }
    return MATRIX_DATA.dimensions[dimId].name;
}

function getDimensionColor(dimId) {
    if (currentAssessment.type === 'culture') {
        return 'var(--primary)';
    }
    return MATRIX_DATA.dimensions[dimId].color;
}

// ===== CULTURE ASSESSMENT =====
function startCultureAssessment() {
    currentAssessment = {
        type: 'culture',
        profileId: null,
        levelId: null,
        ratings: {},
        comments: {},
        startedAt: new Date().toISOString()
    };
    currentDimensionIndex = 0;
    saveInProgressAssessment();
    showAssessmentScreen();
}

// ===== ASSESSMENT =====
function startAssessment() {
    currentAssessment.type = 'profile';
    currentAssessment.ratings = {};
    currentAssessment.comments = {};
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
    var dims = getAssessmentDimensions();
    var dimId = dims[currentDimensionIndex];
    var dimName = getDimensionName(dimId);
    var dimColor = getDimensionColor(dimId);

    // Step label
    if (currentAssessment.type === 'culture') {
        document.getElementById('assessment-step-label').textContent = 'Culture Score Assessment';
    } else {
        document.getElementById('assessment-step-label').textContent = 'Step 3 of 3 \u2014 Self-Assessment';
    }

    // Context
    if (currentAssessment.type === 'culture') {
        document.getElementById('assessment-context').textContent = 'Culture Score';
    } else {
        var profile = MATRIX_DATA.profiles[currentAssessment.profileId];
        var level = MATRIX_DATA.levels[currentAssessment.levelId];
        document.getElementById('assessment-context').textContent =
            profile.name + ' \u2022 ' + level.name;
    }

    // Back button
    var backBtn = document.getElementById('btn-assessment-back');
    if (currentDimensionIndex === 0) {
        backBtn.onclick = function() {
            if (currentAssessment.type === 'culture') {
                goToLanding();
            } else {
                goToLevel();
            }
        };
    } else {
        backBtn.onclick = function() { prevDimension(); };
    }

    // Progress dots
    renderDimensionProgress(currentDimensionIndex);

    // Dimension header
    var dimNameEl = document.getElementById('dimension-name');
    dimNameEl.textContent = dimName;
    dimNameEl.style.color = dimColor;

    var descEl = document.getElementById('dimension-description');
    if (currentAssessment.type === 'culture') {
        descEl.textContent = '';
    } else {
        descEl.textContent = MATRIX_DATA.dimensions[dimId].question || MATRIX_DATA.dimensions[dimId].longDescription;
    }
    document.querySelector('.dimension-header').style.borderLeftColor = dimColor;

    // Rating guidelines
    renderRatingGuidelines();

    // Statements
    var statements = getStatementsForDimension(dimId);
    var container = document.getElementById('statements-container');
    clearElement(container);

    for (var i = 0; i < statements.length; i++) {
        var ratingKey = dimId + '_' + i;
        var currentRating = currentAssessment.ratings[ratingKey];
        var currentComment = currentAssessment.comments[ratingKey] || '';

        // Rating buttons: Not yet / ? / Yes
        var ratingOptions = [
            { value: 'not_yet', label: 'Not yet', cls: 'rating-not-yet' },
            { value: 'unknown', label: '?', cls: 'rating-unknown' },
            { value: 'yes', label: 'Yes', cls: 'rating-yes' }
        ];

        var optionsDiv = el('div', { className: 'rating-options-v2' });
        for (var v = 0; v < ratingOptions.length; v++) {
            var opt = ratingOptions[v];
            var radioInput = el('input', {
                type: 'radio',
                name: 'rating-' + ratingKey,
                id: 'r-' + ratingKey + '-' + opt.value,
                value: opt.value
            });
            if (currentRating === opt.value) radioInput.checked = true;

            var radioLabel = el('label', {
                'for': 'r-' + ratingKey + '-' + opt.value,
                className: 'rating-btn ' + opt.cls,
                textContent: opt.label
            });

            (function(key, val) {
                radioInput.addEventListener('change', function() {
                    rateStatement(key, val);
                });
            })(ratingKey, opt.value);

            optionsDiv.appendChild(el('div', { className: 'rating-option-v2' }, [radioInput, radioLabel]));
        }

        // Comment toggle + textarea
        var commentSection = el('div', { className: 'statement-comment-section' });
        var commentToggle = el('button', {
            className: 'btn-text comment-toggle',
            textContent: currentComment ? 'Edit comment' : 'Add comment'
        });
        var commentTextarea = el('textarea', {
            className: 'comment-textarea' + (currentComment ? '' : ' hidden'),
            placeholder: 'Describe a concrete example from your work...',
            rows: '2'
        });
        commentTextarea.value = currentComment;

        (function(key) {
            commentToggle.addEventListener('click', function() {
                var ta = this.nextElementSibling;
                if (ta.classList.contains('hidden')) {
                    ta.classList.remove('hidden');
                    ta.focus();
                    this.textContent = 'Hide comment';
                } else {
                    ta.classList.add('hidden');
                    this.textContent = ta.value ? 'Edit comment' : 'Add comment';
                }
            });
            commentTextarea.addEventListener('blur', function() {
                currentAssessment.comments[key] = this.value;
                saveInProgressAssessment();
            });
        })(ratingKey);

        commentSection.appendChild(commentToggle);
        commentSection.appendChild(commentTextarea);

        var card = el('div', { className: 'statement-card' }, [
            el('p', { className: 'statement-text', textContent: statements[i] }),
            optionsDiv,
            commentSection
        ]);

        container.appendChild(card);
    }

    // Next button text
    var nextBtn = document.getElementById('btn-next-dimension');
    if (currentDimensionIndex === dims.length - 1) {
        nextBtn.textContent = 'See Results \u2192';
    } else {
        var nextDimName = getDimensionName(dims[currentDimensionIndex + 1]);
        nextBtn.textContent = 'Next: ' + nextDimName + ' \u2192';
    }

    window.scrollTo(0, 0);
}

function renderRatingGuidelines() {
    var container = document.getElementById('rating-guidelines');
    if (container.childNodes.length > 0) return; // Already rendered
    clearElement(container);
    var guidelines = MATRIX_DATA.ratingGuidelines;
    var list = el('ul', { className: 'guidelines-list' });
    for (var i = 0; i < guidelines.length; i++) {
        list.appendChild(el('li', { textContent: guidelines[i] }));
    }
    container.appendChild(list);
}

function toggleGuidelines() {
    var guidelines = document.getElementById('rating-guidelines');
    var btn = document.getElementById('btn-toggle-guidelines');
    if (guidelines.classList.contains('hidden')) {
        guidelines.classList.remove('hidden');
        btn.textContent = 'Hide guidelines';
    } else {
        guidelines.classList.add('hidden');
        btn.textContent = 'Rating guidelines';
    }
}

function renderDimensionProgress(activeIndex) {
    var container = document.getElementById('dimension-progress');
    clearElement(container);
    var dims = getAssessmentDimensions();

    for (var i = 0; i < dims.length; i++) {
        if (i > 0) {
            container.appendChild(el('div', { className: 'dim-dot-connector' }));
        }
        var cls = 'dim-dot';
        if (i === activeIndex) cls += ' active';
        else if (i < activeIndex) cls += ' completed';
        container.appendChild(el('div', { className: cls, title: getDimensionName(dims[i]) }));
    }
}

function getStatements(profileId, levelId, dimensionId) {
    var key = profileId + '_' + levelId + '_' + dimensionId;
    var stmts = MATRIX_DATA.statements[key];
    if (stmts) return stmts;
    console.warn('Missing statements for:', key);
    return [];
}

function rateStatement(ratingKey, value) {
    currentAssessment.ratings[ratingKey] = value;
    saveInProgressAssessment();
}

function prevDimension() {
    if (currentDimensionIndex > 0) {
        saveCurrentComments();
        currentDimensionIndex--;
        renderDimensionAssessment();
    }
}

function nextDimension() {
    var dims = getAssessmentDimensions();
    saveCurrentComments();

    if (currentDimensionIndex < dims.length - 1) {
        currentDimensionIndex++;
        renderDimensionAssessment();
    } else {
        goToResults();
    }
}

function saveCurrentComments() {
    // Comments are saved on blur, but ensure we capture any unsaved
    var textareas = document.querySelectorAll('.comment-textarea');
    textareas.forEach(function(ta) {
        var card = ta.closest('.statement-card');
        if (!card) return;
        var radio = card.querySelector('input[type="radio"]');
        if (!radio) return;
        var name = radio.name.replace('rating-', '');
        currentAssessment.comments[name] = ta.value;
    });
    saveInProgressAssessment();
}

// ===== RESULTS =====
function goToResults() {
    var scores = calculateAllScores();

    if (currentAssessment.type === 'culture') {
        document.getElementById('results-context').textContent =
            'Culture Score \u2022 ' + formatDate(new Date().toISOString());
    } else {
        var profile = MATRIX_DATA.profiles[currentAssessment.profileId];
        var level = MATRIX_DATA.levels[currentAssessment.levelId];
        document.getElementById('results-context').textContent =
            profile.name + ' \u2022 ' + level.name + ' \u2022 ' + formatDate(new Date().toISOString());
    }

    renderRadarChart(scores);
    renderScoreSummary(scores);
    renderNarrative(scores);
    renderGrowthSuggestions(scores);

    var history = loadHistory();
    var sameTypeHistory = history.filter(function(a) { return a.type === currentAssessment.type; });
    var compareBtn = document.getElementById('btn-compare');
    if (sameTypeHistory.length > 0) {
        compareBtn.classList.remove('hidden');
    } else {
        compareBtn.classList.add('hidden');
    }

    showScreen('screen-results');
}

function calculateAllScores() {
    var dims = getAssessmentDimensions();
    var scores = {};
    var totalYes = 0;
    var totalStatements = 0;

    for (var i = 0; i < dims.length; i++) {
        var dimId = dims[i];
        var stmts = getStatementsForDimension(dimId);
        var yesCount = 0;
        for (var j = 0; j < stmts.length; j++) {
            if (currentAssessment.ratings[dimId + '_' + j] === 'yes') {
                yesCount++;
            }
        }
        scores[dimId] = Math.round((yesCount / stmts.length) * 100);
        totalYes += yesCount;
        totalStatements += stmts.length;
    }

    scores.total = Math.round((totalYes / totalStatements) * 100);
    return scores;
}

function renderRadarChart(scores, comparisonScores) {
    var dims = getAssessmentDimensions();
    var labels = dims.map(function(d) {
        return getDimensionName(d) + ' (' + (scores[d] || 0) + '%)';
    });
    var data = dims.map(function(d) { return scores[d] || 0; });
    var baselineData = dims.map(function() { return 100; });

    var datasets = [
        {
            label: 'Expected (100%)',
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
            pointBackgroundColor: 'rgba(26, 92, 92, 0.8)',
            pointBorderColor: 'rgba(26, 92, 92, 0.8)',
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
                    min: 0, max: 100,
                    ticks: { stepSize: 25, display: true, font: { size: 10 }, callback: function(v) { return v + '%'; } },
                    pointLabels: { font: { size: 11, weight: '600' } },
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
    var dims = getAssessmentDimensions();

    for (var i = 0; i < dims.length; i++) {
        var dimId = dims[i];
        var dimName = getDimensionName(dimId);
        var score = scores[dimId] || 0;
        var interp = getScoreInterpretation(score);
        var color = getDimensionColor(dimId);

        var card = el('div', { className: 'score-card', style: { borderTopColor: color } }, [
            el('div', { className: 'score-card-label', textContent: dimName }),
            el('div', { className: 'score-card-value', textContent: score + '%', style: { color: color } }),
            el('div', { className: 'score-card-interpretation', textContent: interp.label })
        ]);
        container.appendChild(card);
    }

    // Total score card
    var totalCard = el('div', { className: 'score-card score-card-total' }, [
        el('div', { className: 'score-card-label', textContent: 'Total' }),
        el('div', { className: 'score-card-value', textContent: scores.total + '%' }),
        el('div', { className: 'score-card-interpretation', textContent: getScoreInterpretation(scores.total).label })
    ]);
    container.appendChild(totalCard);
}

function getScoreInterpretation(score) {
    var labels = MATRIX_DATA.scoreLabels;
    for (var i = 0; i < labels.length; i++) {
        if (score >= labels[i].min) return labels[i];
    }
    return labels[labels.length - 1];
}

// ===== NARRATIVE =====
function renderNarrative(scores) {
    var container = document.getElementById('narrative-section');
    clearElement(container);

    container.appendChild(el('h3', { textContent: 'Summary' }));

    var dims = getAssessmentDimensions();

    // Profile context
    if (currentAssessment.type === 'profile') {
        var profile = MATRIX_DATA.profiles[currentAssessment.profileId];
        var level = MATRIX_DATA.levels[currentAssessment.levelId];
        var levelExp = MATRIX_DATA.levelExpectations[currentAssessment.levelId];
        container.appendChild(el('p', {
            textContent: 'As a ' + profile.name + ' at ' + level.name + ' level, you are expected to ' + levelExp + '.'
        }));
    } else {
        container.appendChild(el('p', {
            textContent: 'Culture Score reflects how well you embody Luscii\u2019s cultural values across 5 dimensions.'
        }));
    }

    // Total score
    container.appendChild(el('p', {
        textContent: 'Overall score: ' + scores.total + '% (' + getScoreInterpretation(scores.total).description + ').'
    }));

    // Find strongest and weakest
    var strongest = dims[0];
    var weakest = dims[0];
    for (var i = 1; i < dims.length; i++) {
        if ((scores[dims[i]] || 0) > (scores[strongest] || 0)) strongest = dims[i];
        if ((scores[dims[i]] || 0) < (scores[weakest] || 0)) weakest = dims[i];
    }

    if (scores[strongest] > scores[weakest]) {
        var strongP = el('p');
        strongP.appendChild(document.createTextNode('Your strongest area is '));
        strongP.appendChild(el('strong', { textContent: getDimensionName(strongest) }));
        strongP.appendChild(document.createTextNode(' (' + scores[strongest] + '%).'));
        container.appendChild(strongP);

        var weakP = el('p');
        weakP.appendChild(document.createTextNode('Your growth opportunity is in '));
        weakP.appendChild(el('strong', { textContent: getDimensionName(weakest) }));
        weakP.appendChild(document.createTextNode(' (' + scores[weakest] + '%).'));
        container.appendChild(weakP);
    }

    // Not-yet statements list
    var notYetItems = [];
    for (var d = 0; d < dims.length; d++) {
        var dimId = dims[d];
        var stmts = getStatementsForDimension(dimId);
        for (var s = 0; s < stmts.length; s++) {
            var rating = currentAssessment.ratings[dimId + '_' + s];
            if (rating === 'not_yet') {
                notYetItems.push({ dim: getDimensionName(dimId), text: stmts[s] });
            }
        }
    }

    if (notYetItems.length > 0) {
        container.appendChild(el('h4', { textContent: 'Statements rated "Not yet" (' + notYetItems.length + ')' }));
        var notYetList = el('ul', { className: 'not-yet-list' });
        for (var n = 0; n < notYetItems.length; n++) {
            notYetList.appendChild(el('li', null, [
                el('strong', { textContent: notYetItems[n].dim + ': ' }),
                document.createTextNode(notYetItems[n].text)
            ]));
        }
        container.appendChild(notYetList);
    }

    // Unknown statements
    var unknownItems = [];
    for (var d2 = 0; d2 < dims.length; d2++) {
        var dimId2 = dims[d2];
        var stmts2 = getStatementsForDimension(dimId2);
        for (var s2 = 0; s2 < stmts2.length; s2++) {
            var rating2 = currentAssessment.ratings[dimId2 + '_' + s2];
            if (rating2 === 'unknown') {
                unknownItems.push({ dim: getDimensionName(dimId2), text: stmts2[s2] });
            }
        }
    }

    if (unknownItems.length > 0) {
        container.appendChild(el('h4', { textContent: 'Statements rated "?" (' + unknownItems.length + ')' }));
        container.appendChild(el('p', {
            textContent: 'Consider gathering more evidence for these behaviours:',
            style: { fontSize: '0.9rem', color: 'var(--text-muted)' }
        }));
        var unknownList = el('ul', { className: 'unknown-list' });
        for (var u = 0; u < unknownItems.length; u++) {
            unknownList.appendChild(el('li', null, [
                el('strong', { textContent: unknownItems[u].dim + ': ' }),
                document.createTextNode(unknownItems[u].text)
            ]));
        }
        container.appendChild(unknownList);
    }
}

// ===== GROWTH SUGGESTIONS =====
function renderGrowthSuggestions(scores) {
    var container = document.getElementById('growth-section');
    clearElement(container);
    var dims = getAssessmentDimensions();

    var allStrong = true;
    for (var i = 0; i < dims.length; i++) {
        if ((scores[dims[i]] || 0) < 80) {
            allStrong = false;
            break;
        }
    }

    if (allStrong) {
        container.appendChild(el('div', { className: 'growth-category' }, [
            el('div', { className: 'growth-category-title', textContent: 'All dimensions strong' }),
            el('p', {
                textContent: 'All your dimensions are at 80% or above. Consider how you can deepen your impact through coaching, knowledge transfer, and organisational influence.',
                style: { fontSize: '0.9rem', lineHeight: '1.5' }
            })
        ]));
        return;
    }

    // Show dimensions below 80% with their unmet statements
    container.appendChild(el('h3', { textContent: 'Focus Areas' }));

    for (var j = 0; j < dims.length; j++) {
        var dimId = dims[j];
        var score = scores[dimId] || 0;
        if (score >= 80) continue;

        var stmts = getStatementsForDimension(dimId);
        var unmet = [];
        for (var k = 0; k < stmts.length; k++) {
            var rating = currentAssessment.ratings[dimId + '_' + k];
            if (rating !== 'yes') {
                unmet.push({ text: stmts[k], rating: rating || 'unrated' });
            }
        }

        if (unmet.length === 0) continue;

        var category = el('div', { className: 'growth-category' });
        category.appendChild(el('div', { className: 'growth-category-title',
            textContent: getDimensionName(dimId) + ' (' + score + '%)' }));

        for (var m = 0; m < unmet.length; m++) {
            var badge = unmet[m].rating === 'not_yet' ? '[Not yet]' :
                unmet[m].rating === 'unknown' ? '[?]' : '[Unrated]';
            category.appendChild(el('div', { className: 'growth-item' }, [
                el('span', null, [
                    el('span', { className: 'growth-badge', textContent: badge + ' ' }),
                    document.createTextNode(unmet[m].text)
                ])
            ]));
        }

        container.appendChild(category);
    }
}

// ===== SAVE & FINISH =====
function saveAndFinish() {
    var scores = calculateAllScores();
    var assessment = {
        id: generateId(),
        type: currentAssessment.type,
        profileId: currentAssessment.profileId,
        levelId: currentAssessment.levelId,
        date: new Date().toISOString(),
        scores: scores,
        total: scores.total,
        ratings: {},
        comments: {}
    };

    // Copy ratings and comments
    for (var key in currentAssessment.ratings) {
        assessment.ratings[key] = currentAssessment.ratings[key];
    }
    for (var ckey in currentAssessment.comments) {
        if (currentAssessment.comments[ckey]) {
            assessment.comments[ckey] = currentAssessment.comments[ckey];
        }
    }

    saveAssessment(assessment);
    saveToLocalStorage('lm2_in_progress', null);

    currentAssessment = {
        type: null,
        profileId: null,
        levelId: null,
        ratings: {},
        comments: {},
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
        var profileText = '';
        if (a.type === 'culture') {
            profileText = 'Culture Score';
        } else {
            var profile = MATRIX_DATA.profiles[a.profileId];
            var level = MATRIX_DATA.levels[a.levelId];
            profileText = profile.name + ' \u2022 ' + level.name;
        }

        var dims = a.type === 'culture' ?
            MATRIX_DATA.cultureScore.cultureDimensionOrder :
            MATRIX_DATA.dimensionOrder;

        var scoresDiv = el('div', { className: 'history-scores' });
        for (var j = 0; j < dims.length; j++) {
            var dimId = dims[j];
            var dimName;
            if (a.type === 'culture') {
                dimName = MATRIX_DATA.cultureScore.dimensions[dimId] ?
                    MATRIX_DATA.cultureScore.dimensions[dimId].name : 'Master';
            } else {
                dimName = MATRIX_DATA.dimensions[dimId].name;
            }
            var abbrev = dimName.charAt(0);
            scoresDiv.appendChild(el('span', { className: 'history-score-item' }, [
                el('span', { className: 'history-score-label', textContent: abbrev + ': ' }),
                document.createTextNode((a.scores[dimId] || 0) + '%')
            ]));
        }

        // Total
        scoresDiv.appendChild(el('span', { className: 'history-score-item history-score-total' }, [
            el('span', { className: 'history-score-label', textContent: 'Total: ' }),
            document.createTextNode((a.total || a.scores.total || 0) + '%')
        ]));

        var typeBadge = el('span', {
            className: 'history-type-badge ' + (a.type === 'culture' ? 'badge-culture' : 'badge-profile'),
            textContent: a.type === 'culture' ? 'Culture' : 'Profile'
        });

        var viewBtn = el('button', { className: 'btn-small', textContent: 'View' });
        var compareBtn = el('button', { className: 'btn-small', textContent: 'Compare' });
        var deleteBtn = el('button', { className: 'btn-small', textContent: 'Delete' });

        (function(aid, atype) {
            viewBtn.addEventListener('click', function() { viewAssessment(aid); });
            compareBtn.addEventListener('click', function() { toggleCompare(this, aid, atype); });
            deleteBtn.addEventListener('click', function() { deleteAssessment(aid); });
        })(a.id, a.type);

        var item = el('div', { className: 'history-item' }, [
            el('div', { className: 'history-item-header' }, [
                el('div', null, [
                    el('span', { className: 'history-item-date', textContent: formatDate(a.date) }),
                    typeBadge
                ]),
                el('span', { className: 'history-item-profile', textContent: profileText })
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

    currentAssessment.type = assessment.type;
    currentAssessment.profileId = assessment.profileId;
    currentAssessment.levelId = assessment.levelId;
    currentAssessment.ratings = assessment.ratings;
    currentAssessment.comments = assessment.comments || {};

    goToResults();
}

function toggleCompare(btn, id, type) {
    var idx = selectedCompareIds.indexOf(id);

    if (idx !== -1) {
        selectedCompareIds.splice(idx, 1);
        btn.classList.remove('active');
        selectedCompareType = null;
    } else {
        // Only allow comparing same-type assessments
        if (selectedCompareIds.length === 1 && selectedCompareType !== type) {
            return;
        }
        if (selectedCompareIds.length >= 2) {
            var allBtns = document.querySelectorAll('.btn-small.active');
            if (allBtns.length > 0) allBtns[0].classList.remove('active');
            selectedCompareIds.shift();
        }
        selectedCompareIds.push(id);
        selectedCompareType = type;
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

    var dims = a1.type === 'culture' ?
        MATRIX_DATA.cultureScore.cultureDimensionOrder :
        MATRIX_DATA.dimensionOrder;

    var labels = dims.map(function(d) {
        if (a1.type === 'culture') {
            return MATRIX_DATA.cultureScore.dimensions[d] ?
                MATRIX_DATA.cultureScore.dimensions[d].name : 'Master';
        }
        return MATRIX_DATA.dimensions[d].name;
    });
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
                    min: 0, max: 100,
                    ticks: { stepSize: 25, font: { size: 10 }, callback: function(v) { return v + '%'; } },
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
        var dimName = labels[j];
        var delta = (a2.scores[dimId] || 0) - (a1.scores[dimId] || 0);
        var sign = delta > 0 ? '+' : '';
        var cls = delta > 0 ? 'positive' : (delta < 0 ? 'negative' : 'neutral');

        deltaContainer.appendChild(el('div', { className: 'delta-card' }, [
            el('div', { className: 'delta-label', textContent: dimName }),
            el('div', { className: 'delta-value ' + cls, textContent: sign + delta + '%' })
        ]));
    }

    document.getElementById('comparison-section').classList.remove('hidden');
}

function closeComparison() {
    document.getElementById('comparison-section').classList.add('hidden');
    selectedCompareIds = [];
    selectedCompareType = null;
    document.querySelectorAll('.btn-small.active').forEach(function(btn) {
        btn.classList.remove('active');
    });
}

function deleteAssessment(assessmentId) {
    if (!confirm('Delete this assessment? This cannot be undone.')) return;
    var history = loadHistory();
    history = history.filter(function(a) { return a.id !== assessmentId; });
    saveToLocalStorage('lm2_history', history);
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
    saveToLocalStorage('lm2_history', history);
}

function loadHistory() {
    return loadFromLocalStorage('lm2_history') || [];
}

function saveInProgressAssessment() {
    saveToLocalStorage('lm2_in_progress', currentAssessment);
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
