// matrix-data.js — All Matrix Reloaded content as structured data
// No logic in this file, only data objects.
//
// HOW TO USE:
// 1. Copy this file to matrix-data.js
// 2. Replace the placeholder statements and growth suggestions with your organisation's content
// 3. Each profile+level+dimension combination needs an array of 4 behavioral statements
// 4. Each profile+dimension+range combination needs an array of 2 growth suggestions
//
// Key formats:
//   statements:        "{profileId}_{levelId}_{dimensionId}"
//   growthSuggestions:  "{profileId}_{dimensionId}_{low|medium|high}"

const MATRIX_DATA = {

    // ===== PROFILES =====
    // Define your organisation's role profiles. The example below follows the Baarda model
    // with 8 profiles ordered by increasing problem-solving complexity.
    profiles: {
        "example-role": {
            name: "Example Role",
            nameDutch: "Voorbeeldrol",
            icon: "\u{1F4CB}",
            problemType: "Concrete, practical",
            scope: "Projects",
            solution: "Exists \u2014 interpret & coordinate",
            coreContribution: "Describe the core contribution of this role.",
            characteristics: [
                "First characteristic",
                "Second characteristic",
                "Third characteristic",
                "Fourth characteristic"
            ],
            addedValue: "Describe the added value this role brings to the organisation.",
            availableLevels: ["junior", "medior", "core", "master"]
        }
        // Add more profiles here...
        // Profile IDs used elsewhere: go-getter, skilled-worker, organiser, expert,
        // connector, luminary, navigator, chess-player
    },

    // ===== LEVELS =====
    // The 4 growth levels within each profile.
    levels: {
        "junior": {
            name: "Junior",
            description: "Works supportively, under the guidance of colleagues, and carries out partial assignments. Examines whether the role suits them.",
            independence: "Low \u2014 'Me' / Own development",
            focus: "Learning if the role fits"
        },
        "medior": {
            name: "Medior",
            description: "Independently carries out smaller and less complex assignments. Still learning, building trust, and finding own style.",
            independence: "Growing \u2014 'Me' / Own development",
            focus: "Building trust, finding own style"
        },
        "core": {
            name: "Core",
            description: "Fully capable of carrying out a wide range of assignments, including complex ones. Visible, proactive, in control.",
            independence: "High \u2014 'Me' / Own development",
            focus: "Visible, proactive, in control"
        },
        "master": {
            name: "Master",
            description: "Authority in the field. Takes the team, customer, field, or organisation to a higher level. Coaching, knowledge transfer, courage.",
            independence: "Very high \u2014 'Us' / Team",
            focus: "Coaching, knowledge transfer, courage"
        }
    },

    // ===== DIMENSIONS =====
    // The 4 learning dimensions used to assess growth.
    dimensions: {
        "mastery": {
            name: "Mastery",
            description: "Knowledge and skill application relevant to your role.",
            longDescription: "The degree to which you possess and apply knowledge and skills relevant to your role. This includes technical competence, depth of understanding, and the ability to apply expertise to real problems.",
            color: "#1a5c5c"
        },
        "autonomy": {
            name: "Autonomy",
            description: "Independent decision-making and approach to work.",
            longDescription: "The extent to which you independently make decisions and determine your own approach to work, based on an understanding of consequences and boundaries.",
            color: "#2d7da8"
        },
        "impact": {
            name: "Impact",
            description: "Influence on others, processes, and outcomes.",
            longDescription: "The degree to which you influence others, collaboration, processes, and outcomes. This includes communicating effectively, aligning with goals, and shaping how work gets done.",
            color: "#5a9e6f"
        },
        "ownership": {
            name: "Ownership",
            description: "Responsibility for results, decisions, and follow-through.",
            longDescription: "The extent to which you take responsibility for results, decisions, and follow-through \u2014 both individually and, over time, collectively.",
            color: "#d4a853"
        }
    },

    // ===== BEHAVIORAL STATEMENTS =====
    // Key format: "{profileId}_{levelId}_{dimensionId}"
    // Each entry is an array of 4 "I" statements the user rates 1-5
    //
    // You need one entry for every combination of profile + available level + dimension.
    // Example: if "example-role" has levels [junior, medior, core, master] and there are 4 dimensions,
    // you need 16 entries (4 levels x 4 dimensions).
    statements: {
        "example-role_junior_mastery": [
            "I am building foundational knowledge in my area of work",
            "I follow established procedures and ask when unsure",
            "I can explain what I do and why to a colleague",
            "I recognise when a task is outside my current ability"
        ],
        "example-role_junior_autonomy": [
            "I complete routine tasks with minimal guidance",
            "I manage my own time within a clear schedule",
            "I ask for help when I encounter something unfamiliar",
            "I follow instructions while beginning to anticipate next steps"
        ],
        "example-role_junior_impact": [
            "I communicate clearly when a task is done or blocked",
            "I support colleagues by sharing what I have learned",
            "I contribute to team workflow through consistent output",
            "I respond constructively to feedback on my work"
        ],
        "example-role_junior_ownership": [
            "I take responsibility for completing my assigned tasks",
            "I follow through on commitments without needing reminders",
            "I flag issues as soon as I notice them",
            "I care about the quality of my own output"
        ],
        "example-role_medior_mastery": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_medior_autonomy": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_medior_impact": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_medior_ownership": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_core_mastery": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_core_autonomy": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_core_impact": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_core_ownership": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_master_mastery": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_master_autonomy": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_master_impact": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ],
        "example-role_master_ownership": [
            "Replace with your organisation's behavioral statements",
            "Each statement should start with 'I' and describe observable behavior",
            "Statements should be calibrated to this specific profile and level",
            "Aim for 4 statements per dimension"
        ]
    },

    // ===== SCORE INTERPRETATION =====
    scoreLabels: {
        "strong":     { min: 4.5, max: 5.0, label: "Strong",     description: "Consistently demonstrated" },
        "solid":      { min: 3.5, max: 4.4, label: "Solid",      description: "Regularly demonstrated, minor gaps" },
        "developing": { min: 2.5, max: 3.4, label: "Developing", description: "Sometimes demonstrated, room to grow" },
        "emerging":   { min: 1.0, max: 2.4, label: "Emerging",   description: "Rarely demonstrated, key growth area" }
    },

    // ===== NARRATIVE TEMPLATES =====
    // Currently unused — narrative is built inline in app.js
    narrativeTemplates: {
        strongestDimension: "Your strongest dimension is **{dimension}** ({score}) \u2014 {interpretation}.",
        weakestDimension: "Your growth opportunity is in **{dimension}** ({score}) \u2014 {interpretation}.",
        naturalOrder: "Your Mastery and Autonomy scores ({maScore}, {auScore}) are stronger than Impact and Ownership ({imScore}, {owScore}). This is consistent with the natural development order \u2014 foundation first, then influence.",
        unusualPattern: "Your Impact and Ownership scores ({imScore}, {owScore}) are higher than Mastery and Autonomy ({maScore}, {auScore}). This is an unusual pattern \u2014 consider strengthening your foundations to sustain your influence.",
        readyForNext: "Your scores suggest readiness for the next level. All dimensions are at 3.5 or above.",
        needsDeepening: "Focus on strengthening **{dimension}** at your current level before considering the next step.",
        allStrong: "All dimensions are strong. Consider how Master-level behaviours \u2014 coaching, knowledge transfer, and organisational influence \u2014 can be your next growth area.",
        profileContext: "As a **{profile}** at **{level}** level, you are expected to {expectation}."
    },

    // ===== GROWTH SUGGESTIONS =====
    // Key format: "{profileId}_{dimensionId}_{scoreRange}" where scoreRange is "low", "medium", or "high"
    // low = 1.0-2.4 (emerging), medium = 2.5-3.4 (developing), high = 3.5-5.0 (solid/strong)
    growthSuggestions: {
        "example-role_mastery_low": [
            "Replace with concrete growth suggestion for low mastery scores",
            "Each suggestion should be actionable and specific to this profile"
        ],
        "example-role_mastery_medium": [
            "Replace with growth suggestion for medium mastery scores",
            "Suggestions should help deepen the current level"
        ],
        "example-role_mastery_high": [
            "Replace with growth suggestion for high mastery scores",
            "Suggestions should prepare for the next level"
        ],
        "example-role_autonomy_low": [
            "Replace with concrete growth suggestion for low autonomy scores",
            "Each suggestion should be actionable and specific to this profile"
        ],
        "example-role_autonomy_medium": [
            "Replace with growth suggestion for medium autonomy scores",
            "Suggestions should help deepen the current level"
        ],
        "example-role_autonomy_high": [
            "Replace with growth suggestion for high autonomy scores",
            "Suggestions should prepare for the next level"
        ],
        "example-role_impact_low": [
            "Replace with concrete growth suggestion for low impact scores",
            "Each suggestion should be actionable and specific to this profile"
        ],
        "example-role_impact_medium": [
            "Replace with growth suggestion for medium impact scores",
            "Suggestions should help deepen the current level"
        ],
        "example-role_impact_high": [
            "Replace with growth suggestion for high impact scores",
            "Suggestions should prepare for the next level"
        ],
        "example-role_ownership_low": [
            "Replace with concrete growth suggestion for low ownership scores",
            "Each suggestion should be actionable and specific to this profile"
        ],
        "example-role_ownership_medium": [
            "Replace with growth suggestion for medium ownership scores",
            "Suggestions should help deepen the current level"
        ],
        "example-role_ownership_high": [
            "Replace with growth suggestion for high ownership scores",
            "Suggestions should prepare for the next level"
        ]
    },

    // ===== LEVEL EXPECTATIONS =====
    // Used in narrative generation for profile context
    levelExpectations: {
        "junior": "work supportively under guidance, carry out partial assignments, and determine whether this role suits you",
        "medior": "independently handle smaller assignments, build trust, and develop your own style within the role",
        "core": "be fully capable across a wide range of assignments including complex work, be visible and proactive",
        "master": "be an authority who takes the team and organisation to a higher level through coaching, knowledge transfer, and courageous leadership"
    },

    // ===== PROGRESSION TIMELINE =====
    // Typical time to reach each level. Set to null if the level is not available for a profile.
    progressionTimeline: {
        "example-role": { junior: "Year 1", medior: "Year 2\u20133", core: "From year 4", master: "From year 5" }
    },

    // ===== DIMENSION ORDER =====
    dimensionOrder: ["mastery", "autonomy", "impact", "ownership"]
};
