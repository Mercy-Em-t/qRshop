/* ==========================================================================
   TerraCoop Main Controller (app.js)
   Integrates SPA routing, dynamic databases, user session management,
   gamified dashboards, interest recommendations, youth tour bookings,
   land lease processing, and the role-based Manager Dashboard.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- DATABASES ---
    
    const FARMS_DATABASE = [
        {
            id: "oakridge",
            name: "Oakridge Permaculture Grounds",
            type: "Permaculture",
            icon: "🌳",
            description: "Dedicated to testing syntropic agriculture, perennial food forestry, and complex companion planting guilds. Designed to run completely off-grid with passive water management.",
            crops: "Heirloom Brandywine Tomatoes, Shiitake Logs, Honeyberries, Hazelnuts",
            research: "Fungal-to-bacterial biomass ratios under diverse organic mulches.",
            travel: "Every 2nd Saturday • Free Bus Transit",
            location: "Oakridge Valley (45km East of City)"
        },
        {
            id: "solaris",
            name: "Solaris Greenhouse Laboratory",
            type: "Tech Greenhouse",
            icon: "🔬",
            description: "A state-of-the-art sustainable solar dome testing off-grid climate loops, smart automated aero-irrigation systems, and year-round urban farming scales.",
            crops: "Organic Microgreens, Culinary Lavender, Strawberries, Medicinal Herbs",
            research: "Sap flow sensor feedback loops for dynamic drip irrigation algorithms.",
            travel: "Every Wednesday & Friday • Lab Shuttle",
            location: "Bio-District North (Metropolitan Core)"
        },
        {
            id: "whispering",
            name: "Whispering Pines Agroforestry",
            type: "Food Forestry",
            icon: "🌲",
            description: "A wide forest re-wilding project combining native pine canopies with shade-tolerant berry orchards, ginseng root beds, and biochar soil enrichment experiments.",
            crops: "Wild Mountain Blackberries, American Ginseng, Biochar Potting Mix",
            research: "Multi-strata canopy carbon sequestration indices vs monocultures.",
            travel: "Monthly Weekend Camping • Travel Gear Provided",
            location: "Whispering Pines Foothills (90km North)"
        }
    ];

    const PROJECTS_DATABASE = [
        {
            id: "microbial",
            title: "Microbial Compost Brewing",
            farm: "Solaris Greenhouse Laboratory",
            difficulty: "easy",
            talentCategory: "Soil & Bio Research",
            description: "Learn to harvest local forest microbiomes to brew aerated compost teas. We'll use microscopes to examine active nematodes and beneficial fungi.",
            requiredVolunteers: 12,
            currentVolunteers: 9,
            progress: 75
        },
        {
            id: "companion",
            title: "Companion Herb Guild Sowing",
            farm: "Oakridge Permaculture Grounds",
            difficulty: "medium",
            talentCategory: "Planting & Forestry",
            description: "Planting a complex multi-strata crop circle combining basil, tomatoes, and marigolds to naturally repel hornworms without chemical pest controls.",
            requiredVolunteers: 20,
            currentVolunteers: 14,
            progress: 70
        },
        {
            id: "inoculation",
            title: "Shiitake Log Inoculation",
            farm: "Whispering Pines Agroforestry",
            difficulty: "hard",
            talentCategory: "Planting & Forestry",
            description: "Drilling, plugging, and waxing 100 oak logs with organic shiitake spawn. These will feed the volunteer circle for the next five years.",
            requiredVolunteers: 15,
            currentVolunteers: 8,
            progress: 53
        },
        {
            id: "solar-irrigation",
            title: "Solar Drip Controller Assembly",
            farm: "Solaris Greenhouse Laboratory",
            difficulty: "medium",
            talentCategory: "Carpentry & Building",
            description: "Building off-grid electronic Arduino water valves powered by miniature solar panels. Requires basic wiring interest (will train).",
            requiredVolunteers: 8,
            currentVolunteers: 7,
            progress: 87
        }
    ];

    const PRODUCE_DATABASE = [
        {
            name: "Oakridge Wildflower Honey",
            category: "Apiary",
            icon: "🍯",
            description: "Rich, multi-floral raw honey harvested from our permaculture buffer zones. Never pasteurized.",
            yield: "140kg harvested this cycle",
            allocation: "Shared among active autumn harvesters"
        },
        {
            name: "Brandywine Heirloom Tomatoes",
            category: "Sanctuary Crops",
            icon: "🍅",
            description: "Massive, juicy beefsteak tomatoes bred specifically for natural resistance and maximum antioxidant profiles.",
            yield: "480kg harvested to date",
            allocation: "100% free volunteer distribution boxes"
        },
        {
            name: "Blue Oyster Mushroom Logs",
            category: "Fungi Sanctuary",
            icon: "🍄",
            description: "High-protein gourmet mushrooms grown entirely on local wood chips and spent brewer grains.",
            yield: "95kg harvested monthly",
            allocation: "Volunteer circle + local community shelter"
        },
        {
            name: "Organic Biochar Compost Mix",
            category: "Soil Pantry",
            icon: "🪵",
            description: "Crushed wood charcoal infused with active worm castings. Boosts water retention by 40%.",
            yield: "2,000kg brewed",
            allocation: "Distributed to members for home gardens"
        }
    ];

    const RESEARCH_DATABASE = [
        {
            title: "Regenerative Agroforestry Soil Analysis",
            year: "2025",
            journal: "TerraCoop Soil Circle Whitepaper",
            abstract: "A two-year study mapping fungal-to-bacterial biomass ratios across three mulch trials. High woodchip compost plots demonstrated a 340% increase in mycorrhizal mycelium network density, correlating with a 24% reduction in dry-season crop water stress.",
            author: "Dr. Evelyn Vance & Oakridge Cohort"
        },
        {
            title: "Sap Flow Data Feedback in Drip Systems",
            year: "2026",
            journal: "Journal of Sustainable Ag-Tech",
            abstract: "Prototyping an off-grid Arduino micro-controller that triggers irrigation lines strictly based on real-time stem sap velocity. Results showed a 40% reduction in water consumption compared to standard timer-based irrigation schedules.",
            author: "Markus Chen & Solaris Laboratory"
        }
    ];

    // --- NEW SIMULATED MANAGED ASSETS DATABASES ---

    const LEASES_DATABASE = [
        {
            id: "lease-1",
            owner: "Jonathan H. Sterling",
            email: "j.sterling@sterlingholdings.com",
            location: "North Oakridge Valley (adjacent to Permaculture site)",
            dimensions: "2.4 Hectares",
            features: "Gentle southern slope, limestone soil base, water stream border",
            term: "5-Year Stewardship",
            status: "pending"
        },
        {
            id: "lease-2",
            owner: "Sophia Martinez",
            email: "sophia.m@gmail.com",
            location: "Bio-District Sector 3 (Rooftop Plot)",
            dimensions: "350 sq. meters",
            features: "Reinforced concrete deck, sun-exposed, secondary water faucet",
            term: "3-Year Stewardship",
            status: "pending"
        },
        {
            id: "lease-3",
            owner: "Highlands Timber Co.",
            email: "leases@highlandstimber.co",
            location: "Whispering Pines Peak 4",
            dimensions: "10 Hectares",
            features: "Densely forested pines, rich forest floor humus, active logging boundary",
            term: "Indefinite Eco-Trust",
            status: "pending"
        }
    ];

    const TOURS_DATABASE = [
        {
            id: "tour-1",
            school: "Sunnyvale Youth Scouts",
            email: "scoutmaster@sunnyvalescouts.org",
            headcount: 18,
            date: "2026-06-06",
            farm: "Whispering Pines Agroforestry",
            theme: "Forest Ecology & Orienteering Merit Badge",
            status: "pending"
        },
        {
            id: "tour-2",
            school: "Valley High Green Club",
            email: "advisor@valleyhigh.edu",
            headcount: 24,
            date: "2026-06-12",
            farm: "Solaris Greenhouse Lab",
            theme: "Advanced Urban Agro-Tech Prototyping",
            status: "pending"
        }
    ];

    const DONATIONS_DATABASE = [
        {
            benefactor: "Patron Robert Croft",
            item: "John Deere walking cultivator",
            category: "Heavy Machinery",
            value: 1200,
            farm: "Oakridge Permaculture Grounds",
            status: "Deployed to Sanctuary"
        },
        {
            benefactor: "Bio-Tech Lab Corp",
            item: "6x digital soil pH and sap velocity sensors",
            category: "Electronics & Sensors",
            value: 850,
            farm: "Solaris Greenhouse Lab",
            status: "Staged for Deployment"
        },
        {
            benefactor: "Elena Rostova (Self)",
            item: "300x Heirloom Brandywine seeds",
            category: "Seeds & Saplings",
            value: 150,
            farm: "Oakridge Permaculture Grounds",
            status: "Cultivated"
        },
        {
            benefactor: "Farming Supply Ltd",
            item: "1000m pressure-compensating drip line",
            category: "Tools & Hardware",
            value: 620,
            farm: "Solaris Greenhouse Lab",
            status: "Staged for Deployment"
        }
    ];

    const MEMBERS_DATABASE = [
        { name: "Rowan Green", email: "rowan@gmail.com", commitments: ["microbial", "companion"], availability: "Weekends", callings: "🌳 Planting, 🔬 Research", badgeId: "TC-2026-8941" },
        { name: "Dr. Evelyn Vance", email: "evelyn@terracoop.org", commitments: ["microbial"], availability: "Weekdays", callings: "🔬 Soil Analysis", badgeId: "TC-2025-4819" },
        { name: "Marcus Chen", email: "marcus@gmail.com", commitments: ["solar-irrigation"], availability: "Weekdays", callings: "🔨 Carpentry, 🔬 Electronics", badgeId: "TC-2026-3029" },
        { name: "Sarah Jenkins", email: "sarah.j@outlook.com", commitments: ["inoculation"], availability: "Weekends", callings: "🌳 Forestry, 🚐 Logistics", badgeId: "TC-2026-1029" }
    ];

    const SWAP_LEDGER_DATABASE = [
        {
            id: "swap-1",
            owner: "Dr. Evelyn Vance",
            item: "50x Organic Purple Cherokee Tomato Seeds",
            category: "Seeds & Saplings",
            qty: "1 Pack (50 seeds)",
            notes: "Harvested Autumn 2025. 92% germination rate in warm seedling beds. High anthocyanin beefsteaks.",
            status: "available",
            claimedBy: null
        },
        {
            id: "swap-2",
            owner: "Sarah Jenkins",
            item: "10kg active worm castings (Vermicompost)",
            category: "Soil & Bio-Compost",
            qty: "1 Sack (10kg)",
            notes: "Brewed locally at Solaris Greenhouse. Rich in active soil flora, perfect for seed starting blends.",
            status: "available",
            claimedBy: null
        },
        {
            id: "swap-3",
            owner: "Marcus Chen",
            item: "3x Terracotta Seedling Nursery Pots",
            category: "Micro-Tools",
            qty: "3 Pots (15cm diameter)",
            notes: "Durable clay nursery pots. Cleaned and sterilized. Great for root aerations.",
            status: "available",
            claimedBy: null
        }
    ];

    const LIBRARY_DATABASE = [
        {
            id: "lib-1",
            title: "Mycelium Running: How Mushrooms Can Help Save the World",
            author: "Paul Stamets",
            category: "soil",
            coverGradient: "linear-gradient(135deg, #1f2937 0%, #064e3b 100%)",
            pages: "356 Pages",
            chapters: [
                { title: "Chapter 1: The Mycelial Mind", summary: "Mycelium represents a biological internet that coordinates forest communications and nutrient distributions." },
                { title: "Chapter 2: Restoring Habitats", summary: "Using wood chips inoculated with oyster mushrooms to decompose toxic pollutants in degraded landscapes." },
                { title: "Chapter 3: Medicinal Fungi", summary: "Analyzing the immune-modulatory pathways of reishi, chaga, and turkey tail extracts." }
            ]
        },
        {
            id: "lib-2",
            title: "Introduction to Permaculture: Guild Design Patterns",
            author: "Bill Mollison",
            category: "permaculture",
            coverGradient: "linear-gradient(135deg, #0f172a 0%, #78350f 100%)",
            pages: "220 Pages",
            chapters: [
                { title: "Chapter 1: Ecological Ethics", summary: "Care of Earth, care of People, and reinvesting surplus to support cooperative ecological growth." },
                { title: "Chapter 2: Companion Guild Sowing", summary: "How companion guilds protect crops from strong winds and naturally deter agricultural pests." },
                { title: "Chapter 3: Passive Water Management", summary: "Designing contour swales and passive channels to capture dry-season rainwater." }
            ]
        },
        {
            id: "lib-3",
            title: "Syntropic Agriculture: Regenerative Forestry in Action",
            author: "Ernst Götsch",
            category: "permaculture",
            coverGradient: "linear-gradient(135deg, #111827 0%, #022c22 100%)",
            pages: "185 Pages",
            chapters: [
                { title: "Chapter 1: Syntropy vs Entropy", summary: "Natural succession moves toward biological complexity and biomass accumulation, not decay." },
                { title: "Chapter 2: High-Density Planting Guides", summary: "Over-planting seeds to trigger companion protection, then selectively pruning to feed soil fungal biomass." },
                { title: "Chapter 3: Passive Carbon Loops", summary: "Coordinating multi-strata crop canopies to achieve off-grid climate balancing scales." }
            ]
        },
        {
            id: "lib-4",
            title: "Off-Grid Arduino Sap Flow Sensor Networks",
            author: "Marcus Chen",
            category: "ag-tech",
            coverGradient: "linear-gradient(135deg, #030712 0%, #1e1b4b 100%)",
            pages: "140 Pages",
            chapters: [
                { title: "Chapter 1: Arduino Soil Moisture Sensing", summary: "Calibrating resistive soil sensors to avoid galvanic corrosion and secure precise measurements." },
                { title: "Chapter 2: Sap-Flow Stem Velocity Sensors", summary: "Building mini thermal sensors to measure sap movement, feedbacking valve control loops." },
                { title: "Chapter 3: Passive Solar Charging Loops", summary: "Using micro solar panels and lithium-ion batteries to power wireless sensor nodes for up to 3 years." }
            ]
        }
    ];

    const CARPOOLS_DATABASE = [
        { id: "carpool-1", host: "Sarah Jenkins", email: "sarah.j@outlook.com", totalSeats: 4, occupiedSeats: 2, riders: ["Marcus Chen"], route: "Bio-District Metro -> Whispering Pines site" },
        { id: "carpool-2", host: "Dr. Evelyn Vance", email: "evelyn@terracoop.org", totalSeats: 3, occupiedSeats: 1, riders: [], route: "Oakridge Valley Central -> Oakridge Grounds Sanctuary" }
    ];

    // Generate 6x6 grids for Farm Sanctuaries (Oakridge & Solaris)
    const OAKRIDGE_GRID = [];
    const SOLARIS_GRID = [];

    const OAKRIDGE_SECTOR_TYPES = ["idle", "planted", "telemetry", "idle", "planted", "idle"];
    const OAKRIDGE_GUILDS = [
        { crops: "Tomato + Marigold + Basil", soilPH: 6.4, water: "58% (Normal)", sapVelocity: "1.4 cm/h" },
        { crops: "Shiitake Logs + Oak canopy", soilPH: 5.8, water: "65% (Damp)", sapVelocity: "0.8 cm/h" },
        { crops: "Hazelnut guild + Cover clover", soilPH: 6.2, water: "52% (Dry)", sapVelocity: "1.1 cm/h" }
    ];

    const SOLARIS_SECTOR_TYPES = ["idle", "telemetry", "planted", "idle", "telemetry", "idle"];
    const SOLARIS_GUILDS = [
        { crops: "Micro-Lavender + Strawberries", soilPH: 6.5, water: "70% (Perfect)", sapVelocity: "2.1 cm/h" },
        { crops: "Aero-Basil + Nutrient mist", soilPH: 6.8, water: "85% (Mist Active)", sapVelocity: "2.8 cm/h" },
        { crops: "Culinary Herbs + Sap sensors", soilPH: 6.6, water: "74% (Optimal)", sapVelocity: "1.9 cm/h" }
    ];

    for (let r = 0; r < 6; r++) {
        const rowChar = String.fromCharCode(65 + r); // A to F
        for (let c = 1; c <= 6; c++) {
            const sectorId = `${rowChar}${c}`;
            
            // Oakridge seed
            const oakTypeIdx = (r * 6 + c) % OAKRIDGE_SECTOR_TYPES.length;
            const oakType = OAKRIDGE_SECTOR_TYPES[oakTypeIdx];
            OAKRIDGE_GRID.push({
                id: sectorId,
                type: oakType,
                guild: oakType !== "idle" ? OAKRIDGE_GUILDS[(r * 6 + c) % OAKRIDGE_GUILDS.length] : null,
                reservedBy: null
            });

            // Solaris seed
            const solTypeIdx = (r * 6 + c) % SOLARIS_SECTOR_TYPES.length;
            const solType = SOLARIS_SECTOR_TYPES[solTypeIdx];
            SOLARIS_GRID.push({
                id: sectorId,
                type: solType,
                guild: solType !== "idle" ? SOLARIS_GUILDS[(r * 6 + c) % SOLARIS_GUILDS.length] : null,
                reservedBy: null
            });
        }
    }

    // --- GLOBAL SESSION MANAGER ---
    
    let currentUser = null;

    // Fallback Preloaded Profiles
    const PRELOADED_VOLUNTEER = {
        name: "Rowan Green",
        email: "rowan@gmail.com",
        phone: "+1 (555) 482-1920",
        talents: ["Planting & Forestry", "Soil & Bio Research"],
        favoriteFarm: "Oakridge Permaculture Grounds",
        schedule: "Every Weekend (Trips & Camping)",
        avatar: "🌱",
        role: "volunteer",
        memberId: "TC-2026-8941",
        claimCode: "TC-HARVEST-8941",
        xp: 20,
        hours: 24,
        crops: 6,
        commitments: ["microbial"] 
    };

    const PRELOADED_MANAGER = {
        name: "Elena Rostova",
        email: "elena@terracoop.org",
        phone: "+1 (555) 777-0099",
        favoriteFarm: "Solaris Greenhouse Lab",
        avatar: "🚜",
        role: "manager",
        memberId: "TC-MGR-7700"
    };

    function loadUserSession() {
        const stored = localStorage.getItem("terracoop_user");
        if (stored) {
            currentUser = JSON.parse(stored);
            syncAppState(true);
        } else {
            currentUser = null;
            syncAppState(false);
        }
    }

    function saveUserSession() {
        if (currentUser) {
            localStorage.setItem("terracoop_user", JSON.stringify(currentUser));
        } else {
            localStorage.removeItem("terracoop_user");
        }
    }

    function syncAppState(isLoggedIn) {
        const bodyEl = document.body;
        if (isLoggedIn && currentUser) {
            bodyEl.classList.add("logged-in");

            // Role Separation classes
            if (currentUser.role === "manager") {
                bodyEl.classList.add("manager-session");
                bodyEl.classList.remove("volunteer-session");
            } else {
                bodyEl.classList.add("volunteer-session");
                bodyEl.classList.remove("manager-session");
            }
            
            // Set header elements
            const avatarHeader = document.getElementById("header-avatar-emoji");
            const usernameHeader = document.getElementById("header-username-text");
            if (avatarHeader) avatarHeader.textContent = currentUser.avatar || "🌱";
            if (usernameHeader) usernameHeader.textContent = currentUser.name.split(" ")[0];
            
            // Sync Profile Form Fields
            const profName = document.getElementById("profile-name");
            const profEmail = document.getElementById("profile-email");
            const profPhone = document.getElementById("profile-phone");
            const profFarm = document.getElementById("profile-favorite-farm");
            const profSched = document.getElementById("profile-schedule");
            
            if (profName) profName.value = currentUser.name;
            if (profEmail) profEmail.value = currentUser.email;
            if (profPhone) profPhone.value = currentUser.phone || '';
            if (profFarm) profFarm.value = currentUser.favoriteFarm || "Solaris Greenhouse Lab";
            if (profSched) profSched.value = currentUser.schedule || "Every Weekend (Trips & Camping)";
            
            // Set Avatar Buttons
            document.querySelectorAll(".avatar-btn").forEach(btn => {
                const av = btn.getAttribute("data-avatar");
                btn.classList.toggle("active", av === currentUser.avatar);
            });

            // Update Dashboards & Personalization
            if (currentUser.role === "manager") {
                renderManagerDashboard();
            } else {
                renderDashboard();
                renderProfileBadgeVisual();
            }
        } else {
            bodyEl.classList.remove("logged-in");
            bodyEl.classList.remove("manager-session");
            bodyEl.classList.remove("volunteer-session");
        }
        
        renderProjects();
    }

    // --- GAME XP RANK SYSTEM ---
    
    function getRank(xp) {
        if (xp >= 60) return "Forest Guardian";
        if (xp >= 30) return "Mycelium Weaver";
        return "Seedling Sprout";
    }

    // --- VOLUNTEER INTERACTION CONTROLLER ---

    function handleProjectCommit(id) {
        if (!currentUser) {
            showToast("Account Required", "Please log in or apply to join TerraCoop first to book tasks!", "🔒");
            const loginModal = document.getElementById("login-modal");
            if (loginModal) loginModal.classList.add("active");
            return;
        }

        if (currentUser.role === "manager") {
            showToast("Manager Restrict", "You are logged in as a Director. Task rosters are strictly for volunteer accounts.", "⚠️");
            return;
        }

        const proj = PROJECTS_DATABASE.find(p => p.id === id);
        if (!proj || currentUser.commitments.includes(id)) return;

        // Mutate User Session State
        currentUser.commitments.push(id);
        currentUser.xp += 10;
        currentUser.hours += 12;
        currentUser.crops += 1;

        // Save session
        saveUserSession();
        syncAppState(true);

        showToast(
            "Expedition Booked! 🚐",
            `Registered for ${proj.title}. Check your dashboard and profile badge!`,
            "🏆"
        );
    }

    function handleProjectCancel(id) {
        if (!currentUser) return;
        
        const index = currentUser.commitments.indexOf(id);
        if (index === -1) return;

        currentUser.commitments.splice(index, 1);
        currentUser.xp = Math.max(0, currentUser.xp - 10);
        currentUser.hours = Math.max(0, currentUser.hours - 12);
        currentUser.crops = Math.max(0, currentUser.crops - 1);

        saveUserSession();
        syncAppState(true);

        showToast(
            "Expedition Cancelled",
            "Your registration has been pulled. Roster slot freed.",
            "🗑️"
        );
    }

    // --- RENDER DYNAMIC PUBLIC MODULES ---

    function renderFarms() {
        const container = document.getElementById("farms-list-container");
        if (!container) return;

        container.innerHTML = FARMS_DATABASE.map(farm => `
            <div class="glass-card farm-card" id="farm-${farm.id}">
                <div class="farm-badge-hdr">
                    <span class="farm-type-tag">${farm.type}</span>
                    <span class="farm-icon-box">${farm.icon}</span>
                </div>
                <div class="farm-body">
                    <h3 class="farm-title">${farm.name}</h3>
                    <p class="farm-desc">${farm.description}</p>
                    <div class="farm-spec-list">
                        <div class="farm-spec-item">
                            <span class="spec-lbl">📍 Location:</span>
                            <span class="spec-val">${farm.location}</span>
                        </div>
                        <div class="farm-spec-item">
                            <span class="spec-lbl">🌱 Crops:</span>
                            <span class="spec-val">${farm.crops}</span>
                        </div>
                        <div class="farm-spec-item">
                            <span class="spec-lbl">🔬 Science:</span>
                            <span class="spec-val">${farm.research}</span>
                        </div>
                    </div>
                </div>
                <div class="farm-footer">
                    <span class="travel-badge">🚐 Travel Trip:</span>
                    <span><strong>${farm.travel}</strong></span>
                </div>
            </div>
        `).join('');
    }

    function renderProjects() {
        const container = document.getElementById("projects-board-container");
        if (!container) return;

        container.innerHTML = PROJECTS_DATABASE.map(proj => {
            const isCommitted = currentUser && currentUser.role === "volunteer" && currentUser.commitments.includes(proj.id);
            const btnText = isCommitted ? "Committed ✓" : "Commit to Task 🌱";
            const btnClass = isCommitted ? "commit-btn committed" : "commit-btn";
            
            const activeVolunteersCount = proj.currentVolunteers + (isCommitted ? 1 : 0);
            const calculatedProgress = Math.min(100, Math.round((activeVolunteersCount / proj.requiredVolunteers) * 100));

            return `
                <div class="glass-card project-card" id="proj-${proj.id}">
                    <div class="proj-header">
                        <span class="difficulty-badge diff-${proj.difficulty}">${proj.difficulty}</span>
                        <span class="proj-farm-tag">${proj.farm}</span>
                    </div>
                    <h3 class="proj-title">${proj.title}</h3>
                    <p class="proj-desc">${proj.description}</p>
                    
                    <div class="proj-progress-panel">
                        <div class="progress-header">
                            <span>Expedition Progress</span>
                            <span id="prog-val-${proj.id}">${calculatedProgress}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" id="prog-bar-${proj.id}" style="width: ${calculatedProgress}%;"></div>
                        </div>
                    </div>

                    <div class="proj-footer">
                        <span class="volunteers-count" id="vol-cnt-${proj.id}">
                            👥 <b>${activeVolunteersCount}</b> / ${proj.requiredVolunteers} signed up
                        </span>
                        <button class="${btnClass}" data-id="${proj.id}" ${isCommitted ? "disabled" : ""}>
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll(".commit-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-id");
                handleProjectCommit(id);
            });
        });
    }

    function renderPantry() {
        const produceContainer = document.getElementById("produce-items-container");
        const scienceContainer = document.getElementById("science-papers-container");

        if (produceContainer) {
            produceContainer.innerHTML = PRODUCE_DATABASE.map(item => `
                <div class="glass-card produce-card">
                    <div class="produce-header">
                        <span class="produce-mock-art">${item.icon}</span>
                    </div>
                    <div class="produce-body">
                        <span class="produce-tag">${item.category}</span>
                        <h3 class="produce-title">${item.name}</h3>
                        <p class="produce-desc">${item.description}</p>
                        <div class="produce-meta">
                            📦 <strong>Current Yield:</strong> ${item.yield}<br>
                            🤝 <strong>Distribution:</strong> ${item.allocation}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        if (scienceContainer) {
            scienceContainer.innerHTML = RESEARCH_DATABASE.map(paper => `
                <div class="glass-card paper-card">
                    <div class="paper-meta">
                        <span class="paper-pub-tag">📄 ${paper.journal}</span>
                        <span>Published ${paper.year}</span>
                    </div>
                    <h3 class="paper-title">${paper.title}</h3>
                    <p class="paper-abstract"><strong>Abstract:</strong> ${paper.abstract}</p>
                    <div class="paper-footer">
                        <span class="paper-author">Lead Author: ${paper.author}</span>
                        <button class="btn btn-read-pdf" data-title="${paper.title}">Read Study</button>
                    </div>
                </div>
            `).join('');

            scienceContainer.querySelectorAll(".btn-read-pdf").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const title = e.target.getAttribute("data-title");
                    showToast(
                        "Opening Document...",
                        `Simulating secure access tunnel to: "${title}"`,
                        "🔬"
                    );
                });
            });
        }
    }

    // --- VOLUNTEER DASHBOARD RENDER ---

    function renderDashboard() {
        if (!currentUser || currentUser.role !== "volunteer") return;

        const dbGreeting = document.getElementById("db-greeting");
        const dbSubGreeting = document.getElementById("db-sub-greeting");
        if (dbGreeting) dbGreeting.textContent = `Welcome back, ${currentUser.name.split(" ")[0]}!`;
        
        if (dbSubGreeting) {
            dbSubGreeting.textContent = currentUser.commitments.length > 0 
                ? `You have ${currentUser.commitments.length} expeditions active on your roster. Ready to plant?`
                : "Your ecological adventure is waiting. Book your first task below!";
        }

        const currentRank = getRank(currentUser.xp);
        const rankPoints = document.getElementById("db-rank-points");
        const rankTitle = document.getElementById("db-rank-title");
        if (rankTitle) rankTitle.textContent = currentRank;
        if (rankPoints) rankPoints.textContent = `${currentUser.xp} XP`;

        const statRank = document.getElementById("db-stat-rank");
        const statHours = document.getElementById("db-stat-hours");
        const statCrops = document.getElementById("db-stat-crops");
        const statCommits = document.getElementById("db-stat-commits");

        if (statRank) statRank.textContent = currentRank;
        if (statHours) statHours.textContent = `${currentUser.hours} Hrs`;
        if (statCrops) statCrops.textContent = `${currentUser.crops} Crops`;
        if (statCommits) statCommits.textContent = `${currentUser.commitments.length} Active`;

        renderMyExpeditions();
        renderRecommendations();
        renderHarvestPass();
        renderMedalsCabinet();
        syncTransitUI();

        // Sync Radial Progress Ring offset dynamically
        const radialFill = document.getElementById("db-radial-progress-fill");
        const radialPercent = document.getElementById("db-radial-percent");
        if (radialPercent) {
            const commitmentsCount = currentUser.commitments.length;
            const percent = Math.min(95, 30 + commitmentsCount * 15);
            radialPercent.textContent = `${percent}%`;
            if (radialFill) {
                const strokeOffset = 213.628 - (percent / 100) * 213.628;
                radialFill.style.strokeDashoffset = strokeOffset;
            }
        }
    }

    function renderMyExpeditions() {
        const container = document.getElementById("db-commitments-container");
        if (!container) return;

        if (currentUser.commitments.length === 0) {
            container.innerHTML = `
                <div class="no-commits glass-card">
                    <p>You haven't committed to any laboratory tasks yet! Explore active projects to plan your roots.</p>
                    <a href="#projects" class="btn btn-primary">Find Tasks</a>
                </div>
            `;
            return;
        }

        const committedTasks = PROJECTS_DATABASE.filter(p => currentUser.commitments.includes(p.id));

        container.innerHTML = committedTasks.map(proj => {
            let scheduleInfo = "Saturday departure";
            if (proj.farm.includes("Solaris")) scheduleInfo = "Wednesday shuttle";

            return `
                <div class="glass-card db-commit-item">
                    <div class="db-commit-meta">
                        <h4>${proj.title}</h4>
                        <span class="farm-lbl">📍 ${proj.farm}</span>
                        <div class="db-commit-details">
                            <span class="det-pill">🚌 Transit: <b>Eco-Shuttle Provided</b></span>
                            <span class="det-pill">⏱️ Schedule: <b>${scheduleInfo}</b></span>
                            <span class="det-pill">🎖️ Reward: <b>+10 XP</b></span>
                        </div>
                    </div>
                    <div>
                        <button class="btn-cancel-commit" data-cancel-id="${proj.id}">Cancel Roster</button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll(".btn-cancel-commit").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const cancelId = e.target.getAttribute("data-cancel-id");
                handleProjectCancel(cancelId);
            });
        });
    }

    function renderRecommendations() {
        const container = document.getElementById("db-recommendations-container");
        if (!container) return;

        const uncommitted = PROJECTS_DATABASE.filter(p => !currentUser.commitments.includes(p.id));

        const recommendations = uncommitted.sort((a, b) => {
            const aMatches = currentUser.talents.some(talent => talent.includes(a.talentCategory.split(" & ")[0]));
            const bMatches = currentUser.talents.some(talent => talent.includes(b.talentCategory.split(" & ")[0]));
            return (bMatches ? 1 : 0) - (aMatches ? 1 : 0);
        });

        const topRecommendations = recommendations.slice(0, 2);

        if (topRecommendations.length === 0) {
            container.innerHTML = `<div style="text-align: center; width: 100%; color: var(--text-muted); padding: 20px;">You are committed to all active club tasks! Exceptional work, guardian.</div>`;
            return;
        }

        container.innerHTML = topRecommendations.map(proj => {
            const isMatch = currentUser.talents.some(t => t.includes(proj.talentCategory.split(" & ")[0]));
            const matchBadge = isMatch ? `<span class="difficulty-badge" style="background: rgba(16,185,129,0.15); color: var(--primary-accent); margin-left: 8px;">★ SKILL MATCH</span>` : '';

            return `
                <div class="glass-card project-card">
                    <div class="proj-header">
                        <div>
                            <span class="difficulty-badge diff-${proj.difficulty}">${proj.difficulty}</span>
                            ${matchBadge}
                        </div>
                        <span class="proj-farm-tag">${proj.farm}</span>
                    </div>
                    <h3 class="proj-title">${proj.title}</h3>
                    <p class="proj-desc">${proj.description}</p>
                    <div class="proj-footer" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top:15px;">
                        <span class="volunteers-count">
                            👥 Target: <b>${proj.requiredVolunteers}</b> members
                        </span>
                        <button class="commit-btn" data-id="${proj.id}">
                            Commit 🌱
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll(".commit-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-id");
                handleProjectCommit(id);
            });
        });
    }

    function renderHarvestPass() {
        const passStatus = document.getElementById("db-pass-status");
        const claimCode = document.getElementById("db-pass-claim-code");
        const boxVolume = document.getElementById("db-pass-volume");

        if (!passStatus || !claimCode || !boxVolume) return;

        claimCode.textContent = currentUser.claimCode || "TC-LOCKED-0000";

        if (currentUser.commitments.length > 0) {
            passStatus.textContent = "READY FOR PICKUP";
            passStatus.className = "pass-val-sec status-active";
            boxVolume.textContent = `~${8 + currentUser.commitments.length * 2}kg Organic Crops`;
        } else {
            passStatus.textContent = "LOCKED (Roster Empty)";
            passStatus.className = "pass-val-sec status-locked";
            boxVolume.textContent = "0kg (Commit to unlock)";
        }
    }

    function renderProfileBadgeVisual() {
        const container = document.getElementById("profile-badge-visual");
        if (!container) return;

        const talentsList = currentUser.talents.map(t => {
            let emoji = "🌿";
            if (t.includes("Forestry")) emoji = "🌳";
            if (t.includes("Soil")) emoji = "🔬";
            if (t.includes("Carpentry")) emoji = "🔨";
            if (t.includes("Travel")) emoji = "🚐";
            if (t.includes("Media")) emoji = "📸";
            return `<span class="talent-badge">${emoji} ${t.split(" & ")[0]}</span>`;
        }).join('');

        container.innerHTML = `
            <div class="ticket-header" style="background: rgba(16,185,129,0.06); padding: 12px 20px;">
                <span class="ticket-logo" style="font-size: 0.95rem;">Terra<b>Coop</b></span>
                <span class="ticket-status-badge" style="font-size:0.6rem; padding: 2px 6px;">${getRank(currentUser.xp).toUpperCase()}</span>
            </div>
            <div class="ticket-body" style="padding: 15px;">
                <div class="user-avatar-badge" style="width: 50px; height: 50px; font-size:1.6rem; margin-bottom: 10px;">${currentUser.avatar || "🌱"}</div>
                <h3 style="font-size: 1.15rem; margin-bottom: 2px;">${currentUser.name}</h3>
                <span class="badge-role" style="font-size: 0.65rem; margin-bottom: 15px;">MEMBER LEVEL PASS</span>
                
                <div class="badge-id-container" style="padding: 5px 15px; margin-bottom: 15px;">
                    <span class="badge-lbl" style="font-size: 0.55rem;">MEMBER ID</span>
                    <span class="badge-id-val" style="font-size: 0.9rem;">${currentUser.memberId}</span>
                </div>
                
                <div class="badge-talents-container" style="padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
                    <div class="badge-talents-list" style="justify-content: center; gap: 4px;">
                        ${talentsList}
                    </div>
                </div>
            </div>
        `;
    }

    // --- MANAGER DASHBOARD CONTROLLER HUB ---

    function renderManagerDashboard() {
        if (!currentUser || currentUser.role !== "manager") return;

        // Greeting
        const mgrGreeting = document.getElementById("mgr-greeting");
        if (mgrGreeting) mgrGreeting.textContent = `Manager Portal: ${currentUser.name}`;

        // Dynamic Counters
        const pendingLeases = LEASES_DATABASE.filter(l => l.status === "pending").length;
        const approvedLeases = LEASES_DATABASE.filter(l => l.status === "approved").length + 12; // simulated pre-approved count
        
        const pendingTours = TOURS_DATABASE.filter(t => t.status === "pending").length;
        const approvedTours = TOURS_DATABASE.filter(t => t.status === "approved").length + 4; // simulated completed count

        document.getElementById("mgr-metric-leases").textContent = `${pendingLeases} Pending`;
        document.getElementById("mgr-metric-leases-active").textContent = `${approvedLeases} Approved Stewardship Leases`;

        document.getElementById("mgr-metric-tours").textContent = `${pendingTours} Requests`;
        document.getElementById("mgr-metric-tours-done").textContent = `${approvedTours} Educational Tours Scheduled`;

        // Render Manager Sub-Panels
        renderManagerLeasesTable();
        renderManagerToursTable();
        renderManagerRostersTable();
        renderManagerDonationsTable();
    }

    // Tab 1: Leases Table
    function renderManagerLeasesTable() {
        const tbody = document.getElementById("mgr-lease-table-body");
        if (!tbody) return;

        if (LEASES_DATABASE.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No land lease applications available.</td></tr>`;
            return;
        }

        tbody.innerHTML = LEASES_DATABASE.map(lease => {
            let actionMarkup = '';
            if (lease.status === "pending") {
                actionMarkup = `
                    <button class="btn-mgr-action btn-mgr-approve" data-approve-lease-id="${lease.id}">Approve</button>
                    <button class="btn-mgr-action btn-mgr-decline" data-decline-lease-id="${lease.id}">Decline</button>
                `;
            } else {
                const badgeClass = lease.status === "approved" ? "badge-approved" : "badge-declined";
                actionMarkup = `<span class="table-badge ${badgeClass}">${lease.status}</span>`;
            }

            return `
                <tr id="row-${lease.id}">
                    <td><strong>${lease.owner}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${lease.email}</span></td>
                    <td>${lease.location}</td>
                    <td><b>${lease.dimensions}</b></td>
                    <td style="font-size:0.8rem; max-width: 250px;">${lease.features}</td>
                    <td><span class="table-badge badge-pending" style="background:rgba(255,255,255,0.05); color:var(--text-secondary); border:none;">${lease.term}</span></td>
                    <td>${actionMarkup}</td>
                </tr>
            `;
        }).join('');

        // Attach action hooks
        tbody.querySelectorAll(".btn-mgr-approve").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-approve-lease-id");
                handleLeaseAction(id, "approved");
            });
        });

        tbody.querySelectorAll(".btn-mgr-decline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-decline-lease-id");
                handleLeaseAction(id, "declined");
            });
        });
    }

    function handleLeaseAction(id, newStatus) {
        const lease = LEASES_DATABASE.find(l => l.id === id);
        if (!lease) return;

        lease.status = newStatus;
        showToast(
            newStatus === "approved" ? "Lease stewardship Approved! ✍️" : "Lease Proposal Declined",
            `Landowner: ${lease.owner}. Status marked as ${newStatus}.`,
            newStatus === "approved" ? "🍀" : "🗑️"
        );

        renderManagerDashboard();
    }

    // Tab 2: Youth Tours Table
    function renderManagerToursTable() {
        const tbody = document.getElementById("mgr-tours-table-body");
        if (!tbody) return;

        if (TOURS_DATABASE.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No educational tour booking requests found.</td></tr>`;
            return;
        }

        tbody.innerHTML = TOURS_DATABASE.map(tour => {
            let actionMarkup = '';
            if (tour.status === "pending") {
                actionMarkup = `<button class="btn-mgr-action btn-mgr-approve" data-approve-tour-id="${tour.id}">Approve Schedule</button>`;
            } else {
                actionMarkup = `<span class="table-badge badge-approved">${tour.status}</span>`;
            }

            return `
                <tr>
                    <td><strong>${tour.school}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${tour.email}</span></td>
                    <td>${tour.farm}</td>
                    <td><b>${tour.date}</b></td>
                    <td>👥 <b>${tour.headcount} Students</b></td>
                    <td style="font-size:0.8rem;">${tour.theme}</td>
                    <td>${actionMarkup}</td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll(".btn-mgr-approve").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-approve-tour-id");
                handleTourAction(id);
            });
        });
    }

    function handleTourAction(id) {
        const tour = TOURS_DATABASE.find(t => t.id === id);
        if (!tour) return;

        tour.status = "approved";
        showToast(
            "School Tour Booked! 🎓",
            `${tour.school} scheduled for ${tour.date} targetting ${tour.farm}. Transit bus booked.`,
            "🎓"
        );

        renderManagerDashboard();
    }

    // Tab 3: Volunteer Rosters Table
    function renderManagerRostersTable() {
        const tbody = document.getElementById("mgr-rosters-table-body");
        if (!tbody) return;

        // Build dynamically combining preloaded databases + current user if volunteer!
        let activeList = [...MEMBERS_DATABASE];
        if (currentUser && currentUser.role === "volunteer") {
            // Check if Rowan exists or merge current session Rowan Green
            const exists = activeList.some(m => m.badgeId === currentUser.memberId);
            if (!exists) {
                activeList.push({
                    name: currentUser.name,
                    email: currentUser.email,
                    commitments: currentUser.commitments,
                    availability: currentUser.schedule.split(" (")[0],
                    callings: currentUser.talents.map(t => t.split(" & ")[0]).join(", "),
                    badgeId: currentUser.memberId
                });
            } else {
                // Update row for current volunteer session Rowan
                const rIdx = activeList.findIndex(m => m.badgeId === currentUser.memberId);
                activeList[rIdx].commitments = currentUser.commitments;
                activeList[rIdx].name = currentUser.name;
                activeList[rIdx].email = currentUser.email;
            }
        }

        tbody.innerHTML = activeList.map(member => {
            const commitmentsPill = member.commitments.length > 0
                ? member.commitments.map(cId => {
                    const taskObj = PROJECTS_DATABASE.find(t => t.id === cId);
                    const taskName = taskObj ? taskObj.title : "Active Task";
                    return `<span class="talent-badge" style="background:rgba(16,185,129,0.06); border-color:rgba(16,185,129,0.15); color:var(--primary-accent);">${taskName}</span>`;
                  }).join(" ")
                : `<span style="color:var(--text-muted); font-style:italic;">No active bookings</span>`;

            // Pull transit type dynamically
            let transitLabel = "🚌 Shuttle Seat";
            if (member.name === currentUser?.name && currentUser?.transitType) {
                const type = currentUser.transitType;
                transitLabel = type === "driver" ? "🚗 Carpool Host" : type === "passenger" ? "🚶 Carpool Rider" : "🚌 Shuttle Seat";
            } else if (member.name === "Sarah Jenkins") {
                transitLabel = "🚗 Carpool Host";
            } else if (member.name === "Marcus Chen") {
                transitLabel = "🚶 Carpool Rider";
            }

            return `
                <tr>
                    <td><strong>${member.name}</strong><br><span class="table-badge" style="background:rgba(255,255,255,0.04); font-size:0.6rem; border:none; margin-top:3px; display:inline-block; color:var(--text-muted);">${transitLabel}</span></td>
                    <td>${member.email}</td>
                    <td style="max-width: 300px; display:flex; flex-wrap:wrap; gap:4px;">${commitmentsPill}</td>
                    <td>${member.availability}</td>
                    <td style="font-size: 0.8rem; color:var(--text-muted);">${member.callings}</td>
                    <td><span class="badge-id-val" style="font-size: 0.8rem; font-family:monospace;">${member.badgeId}</span></td>
                </tr>
            `;
        }).join('');
    }

    // Tab 4: Donations Ledger Table
    function renderManagerDonationsTable() {
        const tbody = document.getElementById("mgr-donations-table-body");
        if (!tbody) return;

        tbody.innerHTML = DONATIONS_DATABASE.map(don => `
            <tr>
                <td><strong>${don.benefactor}</strong></td>
                <td>${don.item}</td>
                <td><span class="table-badge badge-pending" style="background:rgba(255,255,255,0.03); color:var(--text-secondary); border:none;">${don.category}</span></td>
                <td><b style="color:var(--primary-accent);">$${don.value}</b></td>
                <td>📍 ${don.farm.split(" Sanctuary")[0].split(" Grounds")[0].split(" Lab")[0]}</td>
                <td><span class="table-badge badge-approved" style="background:rgba(16,185,129,0.08); font-size:0.65rem;">${don.status}</span></td>
            </tr>
        `).join('');
    }

    // --- MANAGER TAB CLICK CONTROLLER ---
    
    document.querySelectorAll(".mgr-tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetId = e.target.getAttribute("data-mgr-target");
            
            // Toggle tabs active
            document.querySelectorAll(".mgr-tab-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");

            // Toggle panels active
            document.querySelectorAll(".mgr-tab-panel").forEach(p => p.classList.remove("active"));
            const activePanel = document.getElementById(targetId);
            if (activePanel) activePanel.classList.add("active");
        });
    });

    // --- LEASES AND ASSETS TAB TOGGLING ---

    const tabBtnLeaseForm = document.getElementById("tab-btn-lease-form");
    const tabBtnDonationForm = document.getElementById("tab-btn-donation-form");
    const panelLeaseForm = document.getElementById("panel-lease-form");
    const panelDonationForm = document.getElementById("panel-donation-form");

    if (tabBtnLeaseForm && tabBtnDonationForm) {
        tabBtnLeaseForm.addEventListener("click", () => {
            tabBtnLeaseForm.classList.add("active");
            tabBtnDonationForm.classList.remove("active");
            panelLeaseForm.classList.add("active");
            panelDonationForm.classList.remove("active");
        });

        tabBtnDonationForm.addEventListener("click", () => {
            tabBtnDonationForm.classList.add("active");
            tabBtnLeaseForm.classList.remove("active");
            panelDonationForm.classList.add("active");
            panelLeaseForm.classList.remove("active");
        });
    }

    // --- SPA ROUTING GATE WITH ROUTE GUARDS ---

    function handleRouting() {
        const currentHash = window.location.hash || "#home";
        const sections = document.querySelectorAll(".spa-section");
        const navLinks = document.querySelectorAll(".nav-menu .nav-link");
        
        let validRoute = false;

        sections.forEach(sec => {
            if ("#" + sec.id === currentHash) {
                // Dashboard Guard (Managers block out of volunteer dashboard)
                if (sec.id === "dashboard" && currentUser && currentUser.role === "manager") {
                    window.location.hash = "#manager";
                    return;
                }

                // Manager Guard (Volunteers block out of Manager Dashboard)
                if (sec.id === "manager" && (!currentUser || currentUser.role !== "manager")) {
                    window.location.hash = "#home";
                    showToast("Access Restricted", "Cooperative Director credentials required.", "🔒");
                    const loginModal = document.getElementById("login-modal");
                    if (loginModal) loginModal.classList.add("active");
                    return;
                }

                // General Auth Guard for Profile
                if (sec.id === "profile" && !currentUser) {
                    window.location.hash = "#home";
                    showToast("Login Required", "Please log in to manage profile settings.", "🔒");
                    const loginModal = document.getElementById("login-modal");
                    if (loginModal) loginModal.classList.add("active");
                    return;
                }

                // Apply Guard if already logged in
                if (sec.id === "apply" && currentUser) {
                    window.location.hash = currentUser.role === "manager" ? "#manager" : "#dashboard";
                    return;
                }

                sec.classList.add("active");
                validRoute = true;
            } else {
                sec.classList.remove("active");
            }
        });

        if (!validRoute) {
            document.getElementById("home").classList.add("active");
        }

        navLinks.forEach(link => {
            if (link.getAttribute("href") === currentHash) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    window.addEventListener("hashchange", handleRouting);

    // --- MOBILE MENU HAMBURGER DRAWER ---

    const menuToggleBtn = document.getElementById("menu-toggle-btn");
    const navigationBar = document.getElementById("navigation-bar");

    if (menuToggleBtn && navigationBar) {
        menuToggleBtn.addEventListener("click", () => {
            navigationBar.classList.toggle("mobile-active");
            menuToggleBtn.classList.toggle("open");
        });

        navigationBar.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navigationBar.classList.remove("mobile-active");
                menuToggleBtn.classList.remove("open");
            });
        });
    }

    // --- TOAST NOTIFICATIONS MANAGER ---

    function showToast(title, message, icon = "🌱") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <div class="toast-content">
                <h5>${title}</h5>
                <p>${message}</p>
            </div>
        `;

        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add("show"), 50);

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 400);
        }, 4500);
    }

    // --- SUBMIT TOUR BOOKING FORM ---

    const tourForm = document.getElementById("youth-tour-booking-form");
    if (tourForm) {
        tourForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const schoolName = document.getElementById("tour-school").value.trim();
            const coordEmail = document.getElementById("tour-email").value.trim();
            const headcountVal = parseInt(document.getElementById("tour-headcount").value);
            const dateVal = document.getElementById("tour-date").value;
            const targetFarm = document.getElementById("tour-farm").value;
            const themeVal = document.getElementById("tour-theme").value.trim();

            const newTour = {
                id: `tour-${Math.floor(100 + Math.random() * 900)}`,
                school: schoolName,
                email: coordEmail,
                headcount: headcountVal,
                date: dateVal,
                farm: targetFarm,
                theme: themeVal,
                status: "pending"
            };

            // Push to dynamic Tours DB
            TOURS_DATABASE.push(newTour);

            showToast("Tour Requested! 🎓", `${schoolName} has submitted a request. cooperative managers will schedule transit soon.`, "🎓");

            tourForm.reset();

            // Auto-refresh manager tables if manager is actively looking
            if (currentUser && currentUser.role === "manager") {
                renderManagerDashboard();
            }

            // Redirect back to home after booking
            window.location.hash = "#home";
        });
    }

    // --- SUBMIT LAND LEASE PROPOSAL FORM ---

    const leaseForm = document.getElementById("land-lease-application-form");
    if (leaseForm) {
        leaseForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const ownerName = document.getElementById("lease-owner").value.trim();
            const contactEmail = document.getElementById("lease-email").value.trim();
            const propLocation = document.getElementById("lease-location").value.trim();
            const dimensionsVal = document.getElementById("lease-dims").value.trim();
            const termVal = document.getElementById("lease-term").value;
            const featuresVal = document.getElementById("lease-features").value.trim();

            const newLease = {
                id: `lease-${Math.floor(100 + Math.random() * 900)}`,
                owner: ownerName,
                email: contactEmail,
                location: propLocation,
                dimensions: dimensionsVal,
                features: featuresVal,
                term: termVal,
                status: "pending"
            };

            // Push to DB
            LEASES_DATABASE.push(newLease);

            showToast("Lease Offered! ✍️", "Thank you! cooperative directors will evaluate property water access and soil profiles.", "✍️");

            leaseForm.reset();

            if (currentUser && currentUser.role === "manager") {
                renderManagerDashboard();
            }

            window.location.hash = "#home";
        });
    }

    // --- SUBMIT TOOL DONATION FORM ---

    const donationForm = document.getElementById("material-donation-form");
    if (donationForm) {
        donationForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const patronName = document.getElementById("don-name").value.trim();
            const contactEmail = document.getElementById("don-email").value.trim();
            const itemVal = document.getElementById("don-item").value.trim();
            const categoryVal = document.getElementById("don-category").value;
            const estimatedVal = parseInt(document.getElementById("don-value").value);
            const farmAlloc = document.getElementById("don-farm").value;

            const newDonation = {
                benefactor: patronName,
                item: itemVal,
                category: categoryVal,
                value: estimatedVal,
                farm: farmAlloc,
                status: "Staged for Pick-up"
            };

            // Push to DB
            DONATIONS_DATABASE.push(newDonation);

            showToast("Contribution Logged! 🎁", `Registered ${itemVal} ($${estimatedVal}) allocated to ${farmAlloc.split(" ")[0]}.`, "🎁");

            donationForm.reset();

            if (currentUser && currentUser.role === "manager") {
                renderManagerDashboard();
            }

            window.location.hash = "#home";
        });
    }

    // --- MULTI-STEP MEMBERSHIP APPLICATION WIZARD ---

    let currentFormStep = 1;

    const signupForm = document.getElementById("membership-application-form");

    const step1 = document.getElementById("form-step-1");
    const step2 = document.getElementById("form-step-2");
    const step3 = document.getElementById("form-step-3");

    const ind1 = document.getElementById("step-ind-1");
    const ind2 = document.getElementById("step-ind-2");
    const ind3 = document.getElementById("step-ind-3");
    
    const line1 = document.getElementById("step-line-1");
    const line2 = document.getElementById("step-line-2");

    const next1 = document.getElementById("btn-next-1");
    const next2 = document.getElementById("btn-next-2");
    const back2 = document.getElementById("btn-back-2");
    const back3 = document.getElementById("btn-back-3");

    const inputName = document.getElementById("apply-name");
    const inputEmail = document.getElementById("apply-email");
    const inputPhone = document.getElementById("apply-phone");
    const ageCheck = document.getElementById("apply-age-check");

    function updateStepperUI() {
        if (!step1) return;
        
        step1.classList.toggle("active", currentFormStep === 1);
        step2.classList.toggle("active", currentFormStep === 2);
        step3.classList.toggle("active", currentFormStep === 3);

        ind1.classList.toggle("active", currentFormStep === 1);
        ind1.classList.toggle("completed", currentFormStep > 1);

        ind2.classList.toggle("active", currentFormStep === 2);
        ind2.classList.toggle("completed", currentFormStep > 2);
        if (line1) line1.classList.toggle("completed", currentFormStep > 1);

        ind3.classList.toggle("active", currentFormStep === 3);
        if (line2) line2.classList.toggle("completed", currentFormStep > 2);
    }

    function validateStep1() {
        let isValid = true;
        document.querySelectorAll(".error-msg").forEach(el => el.classList.remove("visible"));

        if (!inputName.value.trim()) {
            const err = document.getElementById("err-name");
            if (err) err.classList.add("visible");
            isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inputEmail.value.trim())) {
            const err = document.getElementById("err-email");
            if (err) err.classList.add("visible");
            isValid = false;
        }

        if (!inputPhone.value.trim()) {
            const err = document.getElementById("err-phone");
            if (err) err.classList.add("visible");
            isValid = false;
        }

        if (ageCheck && !ageCheck.checked) {
            showToast("Age Verification Required", "You must confirm you are over 18 or have a travel waiver to join.", "⚠️");
            isValid = false;
        }

        return isValid;
    }

    function validateStep2() {
        if (!signupForm) return false;
        const checkedTalents = signupForm.querySelectorAll('input[name="talents"]:checked');
        if (checkedTalents.length === 0) {
            showToast("Interest Selected Needed", "Please select at least one botanical calling/talent.", "🌿");
            return false;
        }
        return true;
    }

    if (next1) {
        next1.addEventListener("click", () => {
            if (validateStep1()) {
                currentFormStep = 2;
                updateStepperUI();
                showToast("Identity Logged", "Now choose the agricultural callings you wish to explore!", "📝");
            }
        });
    }

    if (next2) {
        next2.addEventListener("click", () => {
            if (validateStep2()) {
                currentFormStep = 3;
                updateStepperUI();
            }
        });
    }

    if (back2) {
        back2.addEventListener("click", () => {
            currentFormStep = 1;
            updateStepperUI();
        });
    }

    if (back3) {
        back3.addEventListener("click", () => {
            currentFormStep = 2;
            updateStepperUI();
        });
    }

    // --- DIGITAL BADGE POPUP GENERATOR ---

    const badgeModal = document.getElementById("badge-modal");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const btnCloseModalBottom = document.getElementById("btn-close-modal-bottom");
    const btnPrintBadge = document.getElementById("btn-print-badge");

    function renderModalBadge() {
        if (!currentUser) return;

        const talentsList = currentUser.talents 
            ? currentUser.talents.map(t => {
                let emoji = "🌿";
                if (t.includes("Forestry")) emoji = "🌳";
                if (t.includes("Soil")) emoji = "🔬";
                if (t.includes("Carpentry")) emoji = "🔨";
                if (t.includes("Travel")) emoji = "🚐";
                if (t.includes("Media")) emoji = "📸";
                return `<span class="talent-badge">${emoji} ${t}</span>`;
              }).join('')
            : '<span class="talent-badge">🚜 Sanctuary Director</span>';

        const badgeName = document.getElementById("badge-user-name");
        const badgeId = document.getElementById("badge-user-id");
        const badgeFarm = document.getElementById("badge-user-farm");
        const badgeSchedule = document.getElementById("badge-user-schedule");
        const badgeAvatar = document.getElementById("badge-visual-avatar");
        const badgeTalents = document.getElementById("badge-user-talents");

        if (badgeName) badgeName.textContent = currentUser.name;
        if (badgeId) badgeId.textContent = currentUser.memberId;
        if (badgeFarm) badgeFarm.textContent = (currentUser.favoriteFarm || PRELOADED_VOLUNTEER.favoriteFarm).split(" Valley")[0].split(" Grounds")[0].split(" Lab")[0];
        if (badgeSchedule) badgeSchedule.textContent = (currentUser.schedule || "Manager Cycle").split(" (")[0];
        if (badgeAvatar) badgeAvatar.textContent = currentUser.avatar || "🌿";
        
        if (badgeTalents) {
            badgeTalents.innerHTML = talentsList;
        }

        if (badgeModal) badgeModal.classList.add("active");
    }

    const closeModalFunc = () => {
        if (badgeModal) badgeModal.classList.remove("active");
    };

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModalFunc);
    if (btnCloseModalBottom) btnCloseModalBottom.addEventListener("click", closeModalFunc);
    if (badgeModal) {
        badgeModal.addEventListener("click", (e) => {
            if (e.target === badgeModal) closeModalFunc();
        });
    }

    if (btnPrintBadge) {
        btnPrintBadge.addEventListener("click", () => {
            showToast("Pass Export Activated", "Your digital credential graphic file render is saving. (Simulation)", "⎙");
        });
    }

    // Submit Join Form handler
    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!validateStep1() || !validateStep2()) return;

            const nameVal = inputName.value.trim();
            const emailVal = inputEmail.value.trim();
            const phoneVal = inputPhone.value.trim();
            
            const favFarm = document.getElementById("apply-favorite-farm").value;
            const sched = document.getElementById("apply-schedule").value;
            
            const talentsVal = Array.from(signupForm.querySelectorAll('input[name="talents"]:checked'))
                .map(cb => cb.value);

            const randomIdTail = Math.floor(1000 + Math.random() * 9000);
            
            currentUser = {
                name: nameVal,
                email: emailVal,
                phone: phoneVal,
                talents: talentsVal,
                favoriteFarm: favFarm,
                schedule: sched,
                avatar: "🌱",
                role: "volunteer",
                memberId: `TC-2026-${randomIdTail}`,
                claimCode: `TC-HARVEST-${randomIdTail}`,
                xp: 10,
                hours: 12,
                crops: 4,
                commitments: []
            };

            saveUserSession();
            syncAppState(true);
            renderModalBadge();

            showToast("Welcome to TerraCoop! 🎉", "Your membership application was successful.", "🍀");

            signupForm.reset();
            currentFormStep = 1;
            updateStepperUI();

            window.location.hash = "#dashboard";
        });
    }

    // --- ANONYMOUS ACCOUNT LOGIN MODAL CONTROLLERS ---

    const loginModal = document.getElementById("login-modal");
    const navLoginBtn = document.getElementById("nav-login-btn");
    const btnCloseLogin = document.getElementById("btn-close-login");
    const loginForm = document.getElementById("account-login-form");
    const btnLoginToRegister = document.getElementById("btn-login-to-register");

    if (navLoginBtn && loginModal) {
        navLoginBtn.addEventListener("click", () => {
            loginModal.classList.add("active");
        });
    }

    const closeLoginFunc = () => {
        if (loginModal) loginModal.classList.remove("active");
    };

    if (btnCloseLogin) btnCloseLogin.addEventListener("click", closeLoginFunc);
    if (loginModal) {
        loginModal.addEventListener("click", (e) => {
            if (e.target === loginModal) closeLoginFunc();
        });
    }

    if (btnLoginToRegister && loginModal) {
        btnLoginToRegister.addEventListener("click", () => {
            loginModal.classList.remove("active");
        });
    }

    // Submit Login form
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const idInput = document.getElementById("login-member-id").value.trim().toUpperCase();
            const errLogin = document.getElementById("err-login-id");

            if (errLogin) errLogin.classList.remove("visible");

            if (idInput === "TC-2026-8941" || idInput === PRELOADED_VOLUNTEER.memberId || idInput === "8941") {
                // Log in Rowan Green (Volunteer)
                currentUser = JSON.parse(JSON.stringify(PRELOADED_VOLUNTEER));
                saveUserSession();
                syncAppState(true);
                
                closeLoginFunc();
                showToast("Session Restored 🔑", `Welcome back, ${currentUser.name}!`, "🌱");
                window.location.hash = "#dashboard";
            } else if (idInput === "TC-MGR-7700" || idInput === "7700") {
                // Log in Elena Rostova (Manager)
                currentUser = JSON.parse(JSON.stringify(PRELOADED_MANAGER));
                saveUserSession();
                syncAppState(true);
                
                closeLoginFunc();
                showToast("cooperative Director Logged In 🚜", `Manager: Elena Rostova. Loading Live administrative ledger...`, "🚜");
                window.location.hash = "#manager";
            } else if (idInput.startsWith("TC-2026-") && idInput.length === 12) {
                // Custom Simulated Volunteer Session
                const randTail = idInput.split("TC-2026-")[1];
                currentUser = {
                    name: "Soil Pioneer",
                    email: "pioneer@terracoop.org",
                    phone: "+1 (555) 000-0000",
                    talents: ["Soil & Bio Research"],
                    favoriteFarm: "Solaris Greenhouse Lab",
                    schedule: "Weekdays (Greenhouse & Local Science)",
                    avatar: "🍄",
                    role: "volunteer",
                    memberId: idInput,
                    claimCode: `TC-HARVEST-${randTail}`,
                    xp: 10,
                    hours: 12,
                    crops: 4,
                    commitments: []
                };
                saveUserSession();
                syncAppState(true);
                
                closeLoginFunc();
                showToast("Session Restored 🔑", "Active volunteer file loaded.", "🌱");
                window.location.hash = "#dashboard";
            } else {
                if (errLogin) errLogin.classList.add("visible");
                showToast("Login Failed", "Test Rowan Green (TC-2026-8941) or Manager (TC-MGR-7700).", "⚠️");
            }
        });
    }

    // Demo quick Fill Logins handlers
    const btnQuickVol = document.getElementById("btn-quick-login-vol");
    const btnQuickMgr = document.getElementById("btn-quick-login-mgr");
    const idField = document.getElementById("login-member-id");
    const loginSubmitBtn = document.getElementById("btn-login-submit");

    if (btnQuickVol && idField && loginSubmitBtn) {
        btnQuickVol.addEventListener("click", (e) => {
            e.preventDefault();
            idField.value = "TC-2026-8941";
            loginSubmitBtn.click();
        });
    }

    if (btnQuickMgr && idField && loginSubmitBtn) {
        btnQuickMgr.addEventListener("click", (e) => {
            e.preventDefault();
            idField.value = "TC-MGR-7700";
            loginSubmitBtn.click();
        });
    }

    // Log Out controller
    const btnLogoutHeader = document.getElementById("btn-logout");
    if (btnLogoutHeader) {
        btnLogoutHeader.addEventListener("click", () => {
            currentUser = null;
            saveUserSession();
            syncAppState(false);
            
            showToast("Logged Out Successfully", "Your session was cleared safely from cache.", "📴");
            window.location.hash = "#home";
        });
    }

    // --- PROFILE SETTINGS EDITOR FORM HANDLER ---

    const profileForm = document.getElementById("profile-settings-form");
    const btnShowPassModal = document.getElementById("btn-show-pass-modal");

    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const nameVal = document.getElementById("profile-name").value.trim();
            const emailVal = document.getElementById("profile-email").value.trim();
            const phoneVal = document.getElementById("profile-phone").value.trim();
            const favFarm = document.getElementById("profile-favorite-farm").value;
            const sched = document.getElementById("profile-schedule").value;

            currentUser.name = nameVal;
            currentUser.email = emailVal;
            currentUser.phone = phoneVal;
            currentUser.favoriteFarm = favFarm;
            currentUser.schedule = sched;

            saveUserSession();
            syncAppState(true);

            showToast("Settings Updated", "Your profile modifications have been synced successfully.", "💾");
        });
    }

    // Avatar pickers click listeners
    document.querySelectorAll(".avatar-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            if (!currentUser) return;

            const av = e.target.getAttribute("data-avatar");
            currentUser.avatar = av;

            document.querySelectorAll(".avatar-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");

            saveUserSession();
            syncAppState(true);

            showToast("Avatar Changed", `Profile avatar icon set to: ${av}`, av);
        });
    });

    if (btnShowPassModal) {
        btnShowPassModal.addEventListener("click", () => {
            renderModalBadge();
        });
    }

    if (btnShowPassModal) {
        btnShowPassModal.addEventListener("click", () => {
            renderModalBadge();
        });
    }

    // ==========================================================================
    // PHASE 2 - ADVANCED INTERACTION LOGIC CONTROLLERS
    // ==========================================================================

    // --- 🗺️ INTERACTIVE SENSORY AG-GRID CONTROLLER ---

    const btnFarmsCards = document.getElementById("tab-btn-farms-cards");
    const btnFarmsGrid = document.getElementById("tab-btn-farms-grid");
    const farmsCardsContainer = document.getElementById("farms-list-container");
    const farmsGridContainer = document.getElementById("farms-grid-container");

    if (btnFarmsCards && btnFarmsGrid) {
        btnFarmsCards.addEventListener("click", () => {
            btnFarmsCards.classList.add("active");
            btnFarmsGrid.classList.remove("active");
            farmsCardsContainer.style.display = "grid";
            farmsGridContainer.style.display = "none";
        });

        btnFarmsGrid.addEventListener("click", () => {
            btnFarmsGrid.classList.add("active");
            btnFarmsCards.classList.remove("active");
            farmsCardsContainer.style.display = "none";
            farmsGridContainer.style.display = "flex";
            renderFarmGridMatrix("oakridge"); // Default
        });
    }

    // Selector buttons Oakridge vs. Solaris
    document.querySelectorAll(".btn-farm-sel").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".btn-farm-sel").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            const targetFarm = e.target.getAttribute("data-farm-grid-target");
            renderFarmGridMatrix(targetFarm);
        });
    });

    let selectedGridCell = null;
    let activeFarmTarget = "oakridge";

    function renderFarmGridMatrix(farmId) {
        activeFarmTarget = farmId;
        const gridMatrixRoot = document.getElementById("farm-grid-matrix-root");
        if (!gridMatrixRoot) return;

        const gridData = farmId === "oakridge" ? OAKRIDGE_GRID : SOLARIS_GRID;
        gridMatrixRoot.innerHTML = gridData.map(cell => {
            let classType = "cell-idle";
            if (cell.reservedBy) {
                classType = (currentUser && cell.reservedBy === currentUser.memberId) ? "cell-reserved" : "cell-planted";
            } else if (cell.type === "planted") {
                classType = "cell-planted";
            } else if (cell.type === "telemetry") {
                classType = "cell-telemetry";
            }

            const label = cell.guild ? cell.guild.crops.split(" + ")[0] : "";
            const isSelected = selectedGridCell && selectedGridCell.id === cell.id ? "selected" : "";

            return `
                <div class="ag-grid-cell ${classType} ${isSelected}" data-cell-id="${cell.id}">
                    <b>${cell.id}</b>
                    <span class="ag-grid-cell-label" style="font-size:0.52rem; opacity:0.65; margin-top:2px;">${label.substring(0, 10)}</span>
                </div>
            `;
        }).join('');

        // Attach click listeners to grid cells
        gridMatrixRoot.querySelectorAll(".ag-grid-cell").forEach(cellEl => {
            cellEl.addEventListener("click", () => {
                const cellId = cellEl.getAttribute("data-cell-id");
                selectGridCell(farmId, cellId);
            });
        });
    }

    function selectGridCell(farmId, cellId) {
        const gridData = farmId === "oakridge" ? OAKRIDGE_GRID : SOLARIS_GRID;
        const cell = gridData.find(c => c.id === cellId);
        if (!cell) return;

        selectedGridCell = cell;
        
        // Highlight active cell visually
        document.querySelectorAll(".ag-grid-cell").forEach(el => {
            el.classList.toggle("selected", el.getAttribute("data-cell-id") === cellId);
        });

        const detailEmpty = document.querySelector("#ag-grid-detail-panel .detail-empty-state");
        const detailContent = document.getElementById("ag-grid-detail-content");
        if (detailEmpty) detailEmpty.style.display = "none";
        if (detailContent) {
            detailContent.style.display = "flex";
            detailContent.style.flexDirection = "column";
            detailContent.style.gap = "15px";
            
            // Build telemetric readout
            let hydrationVal = cell.guild ? cell.guild.water : "32% (Dry - Unseeded)";
            let phVal = cell.guild ? cell.guild.soilPH : "5.5 (Unconditioned)";
            let sapVal = cell.guild ? cell.guild.sapVelocity : "0.0 cm/h";

            // If telemetry type, let's simulate live shifting slightly!
            if (cell.type === "telemetry") {
                const shiftHydration = Math.floor(Math.random() * 6) - 3;
                const baseWater = parseInt(hydrationVal.split("%")[0]);
                hydrationVal = `${baseWater + shiftHydration}% (Live Telemetry)`;
            }

            const isReserved = cell.reservedBy !== null;
            const isUserReserved = currentUser && cell.reservedBy === currentUser.memberId;
            let actionBtnMarkup = "";

            if (!currentUser) {
                actionBtnMarkup = `<p style="font-size:0.75rem; color:var(--accent-red); font-weight:600; text-align:center;">🔒 Log in to reserve grid slot.</p>`;
            } else if (currentUser.role === "manager") {
                actionBtnMarkup = `<p style="font-size:0.75rem; color:var(--secondary); font-weight:600; text-align:center;">🚜 Director view. Reservations strictly for volunteers.</p>`;
            } else if (isUserReserved) {
                actionBtnMarkup = `
                    <button class="btn btn-secondary" id="btn-release-slot" style="width: 100%; font-size:0.8rem; padding:8px 12px;">Release Slot Stewardship 🗑️</button>
                `;
            } else if (isReserved) {
                actionBtnMarkup = `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center;">👥 Steward: Cohort Member ID: ${cell.reservedBy}</p>`;
            } else {
                actionBtnMarkup = `
                    <button class="btn btn-primary glow-btn" id="btn-reserve-slot" style="width: 100%; font-size:0.8rem; padding:8px 12px;">Reserve Slot Stewardship 🌱</button>
                `;
            }

            detailContent.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
                    <h3 style="font-size: 1.15rem; margin:0;">Node Sector: <span style="color:var(--primary-accent);">${cell.id}</span></h3>
                    <span class="table-badge" style="background:rgba(255,255,255,0.05); border:none; font-size:0.65rem;">${farmId === "oakridge" ? "Oakridge" : "Solaris"}</span>
                </div>
                
                <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 8px;">
                    <div><strong>Type Sector:</strong> <span style="text-transform: capitalize;">${cell.type}</span></div>
                    <div><strong>Planting Guild:</strong> ${cell.guild ? cell.guild.crops : "None (Available for cultivation design)"}</div>
                </div>

                <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.04); display: flex; flex-direction: column; gap: 8px;">
                    <h4 style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: hsl(190, 90%, 50%); letter-spacing: 0.05em; margin:0 0 5px 0;">📡 Telemetric Soil Metrics</h4>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
                        <span>💧 Soil Hydration:</span>
                        <b>${hydrationVal}</b>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
                        <span>🔬 Soil pH Base:</span>
                        <b>${phVal}</b>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
                        <span>🪴 Stem Sap Velocity:</span>
                        <b>${sapVal}</b>
                    </div>
                </div>

                <div style="margin-top: 10px;">
                    ${actionBtnMarkup}
                </div>
            `;

            // Bind action buttons
            const reserveBtn = document.getElementById("btn-reserve-slot");
            const releaseBtn = document.getElementById("btn-release-slot");

            if (reserveBtn) {
                reserveBtn.addEventListener("click", () => {
                    cell.reservedBy = currentUser.memberId;
                    
                    // Add as custom commitment
                    currentUser.commitments.push(`grid-${farmId}-${cell.id}`);
                    currentUser.xp += 10;
                    currentUser.hours += 8;
                    currentUser.crops += 1;
                    
                    saveUserSession();
                    syncAppState(true);
                    selectGridCell(farmId, cell.id);
                    renderFarmGridMatrix(farmId);
                    
                    showToast(
                        "Sector Reserved! 🌱",
                        `You are now steward of Node ${cell.id}. +10 XP awarded!`,
                        "🏆"
                    );
                });
            }

            if (releaseBtn) {
                releaseBtn.addEventListener("click", () => {
                    cell.reservedBy = null;
                    
                    const index = currentUser.commitments.indexOf(`grid-${farmId}-${cell.id}`);
                    if (index !== -1) currentUser.commitments.splice(index, 1);
                    
                    currentUser.xp = Math.max(0, currentUser.xp - 10);
                    currentUser.hours = Math.max(0, currentUser.hours - 8);
                    currentUser.crops = Math.max(0, currentUser.crops - 1);
                    
                    saveUserSession();
                    syncAppState(true);
                    selectGridCell(farmId, cell.id);
                    renderFarmGridMatrix(farmId);
                    
                    showToast("Sector Stewardship Released", `Relinquished stewardship of Sector ${cell.id}.`, "🗑️");
                });
            }
        }
    }

    // --- 🔄 SEED & SOIL EXCHANGE LEDGER CONTROLLER ---

    const swapModal = document.getElementById("swap-modal");
    const btnTriggerSwap = document.getElementById("btn-trigger-swap-modal");
    const btnCloseSwap = document.getElementById("btn-close-swap");
    const swapForm = document.getElementById("swap-offer-form");

    if (btnTriggerSwap && swapModal) {
        btnTriggerSwap.addEventListener("click", () => {
            if (!currentUser) {
                showToast("Account Required", "Please log in to offer swap resources.", "🔒");
                const loginModal = document.getElementById("login-modal");
                if (loginModal) loginModal.classList.add("active");
                return;
            }
            swapModal.classList.add("active");
        });
    }

    const closeSwapFunc = () => {
        if (swapModal) swapModal.classList.remove("active");
    };

    if (btnCloseSwap) btnCloseSwap.addEventListener("click", closeSwapFunc);
    if (swapModal) {
        swapModal.addEventListener("click", (e) => {
            if (e.target === swapModal) closeSwapFunc();
        });
    }

    if (swapForm) {
        swapForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const name = document.getElementById("swap-item-name").value.trim();
            const category = document.getElementById("swap-category").value;
            const quantity = document.getElementById("swap-quantity").value.trim();
            const notes = document.getElementById("swap-notes").value.trim();

            const newOffer = {
                id: `swap-${Math.floor(100 + Math.random() * 900)}`,
                owner: currentUser.name,
                item: name,
                category: category,
                qty: quantity,
                notes: notes,
                status: "available",
                claimedBy: null
            };

            SWAP_LEDGER_DATABASE.push(newOffer);
            currentUser.xp += 10;
            saveUserSession();
            syncAppState(true);
            renderSwapLedger();
            closeSwapFunc();
            swapForm.reset();

            showToast("Swap Posted! 🔄", `Successfully listed ${name}. +10 XP awarded!`, "🏆");
        });
    }

    function renderSwapLedger() {
        const container = document.getElementById("exchange-items-container");
        if (!container) return;

        if (SWAP_LEDGER_DATABASE.length === 0) {
            container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);">No swap offers available yet. Post yours!</div>`;
            return;
        }

        container.innerHTML = SWAP_LEDGER_DATABASE.map(offer => {
            const isClaimed = offer.status === "claimed";
            let actionBtnMarkup = "";

            if (isClaimed) {
                actionBtnMarkup = `
                    <span class="table-badge badge-approved" style="background:rgba(16,185,129,0.08); display:block; text-align:center; padding:6px; font-size:0.7rem;">Claimed by ${offer.claimedBy.split(" ")[0]}</span>
                `;
            } else if (!currentUser) {
                actionBtnMarkup = `
                    <button class="btn btn-secondary" disabled style="width:100%; padding:6px; font-size:0.75rem;">Log in to Claim</button>
                `;
            } else if (currentUser.name === offer.owner) {
                actionBtnMarkup = `
                    <span class="table-badge" style="background:rgba(255,255,255,0.05); display:block; text-align:center; padding:6px; color:var(--text-muted); font-size:0.7rem;">Your Listing</span>
                `;
            } else {
                actionBtnMarkup = `
                    <button class="btn btn-primary btn-claim-swap" data-swap-id="${offer.id}" style="width:100%; padding:6px; font-size:0.75rem;">Claim Free Swap 🔄</button>
                `;
            }

            return `
                <div class="glass-card produce-card" style="border-radius:16px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
                    <div class="produce-header" style="height:100px; font-size:3rem; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.25);">
                        ${offer.category.includes("Seeds") ? "🌻" : offer.category.includes("Soil") ? "🪵" : "🏺"}
                    </div>
                    <div class="produce-body" style="padding:15px; display:flex; flex-direction:column; gap:6px; flex-grow:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span class="produce-tag">${offer.category}</span>
                            <span style="font-size:0.65rem; color:var(--text-muted);">By ${offer.owner.split(" ")[0]}</span>
                        </div>
                        <h3 class="produce-title" style="font-size:0.95rem; line-height:1.2; font-weight:700; margin:0;">${offer.item}</h3>
                        <p class="produce-desc" style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4; margin:0; flex-grow:1;">${offer.notes}</p>
                        <div style="font-size:0.72rem; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
                            📦 <strong>Quantity:</strong> ${offer.qty}
                        </div>
                    </div>
                    <div style="padding:15px; border-top:1px solid rgba(255,255,255,0.05);">
                        ${actionBtnMarkup}
                    </div>
                </div>
            `;
        }).join('');

        // Bind claim buttons
        container.querySelectorAll(".btn-claim-swap").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const swapId = e.target.getAttribute("data-swap-id");
                handleClaimSwap(swapId);
            });
        });
    }

    function handleClaimSwap(swapId) {
        const offer = SWAP_LEDGER_DATABASE.find(o => o.id === swapId);
        if (!offer || !currentUser) return;

        offer.status = "claimed";
        offer.claimedBy = currentUser.name;

        currentUser.xp += 5;
        // Seed Transaction History
        if (!currentUser.claims) currentUser.claims = [];
        currentUser.claims.push({
            item: offer.item,
            pickupCode: `TC-SWAP-${offer.id.split("-")[1]}-${Math.floor(10 + Math.random() * 90)}`
        });

        saveUserSession();
        syncAppState(true);
        renderSwapLedger();

        showToast(
            "Resource Claimed! 🔄",
            `Claimed ${offer.item}. Ticket generated in My Dashboard!`,
            "🏆"
        );
    }

    // --- 🚐 EXPEDITION TRANSIT & CARPOOL CONTROLLER ---

    function initTransitEvents() {
        document.querySelectorAll('input[name="user-transit-type"]').forEach(radio => {
            radio.addEventListener("change", (e) => {
                if (!currentUser) return;
                currentUser.transitType = e.target.value;
                saveUserSession();
                syncTransitUI();
                renderManagerDashboard(); // Refresh manager rosters
            });
        });
    }

    function syncTransitUI() {
        const detailsBox = document.getElementById("transit-context-details");
        if (!detailsBox || !currentUser) return;

        // Sync radio selection check
        const currentType = currentUser.transitType || "shuttle";
        document.querySelectorAll('input[name="user-transit-type"]').forEach(r => {
            r.checked = r.value === currentType;
        });

        if (currentType === "shuttle") {
            detailsBox.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <div style="color:var(--primary-accent); font-weight:700;">🚌 Cooperative Shuttle:</div>
                    <div>Route: Central Bio-Hub ➜ Sanctuary Sites</div>
                    <div>Status: <span class="table-badge badge-approved" style="background:rgba(16,185,129,0.08); font-size:0.65rem; border:none; display:inline-block; margin-top:2px;">Reserved Seat ✓</span></div>
                    <div style="font-size:0.72rem; color:var(--text-muted); margin-top:5px; line-height:1.3;">Eco-transit departs Saturdays at 08:00 AM from Central Metro Gate. Free for active volunteers.</div>
                </div>
            `;
        } else if (currentType === "driver") {
            // Find if user already hosts a carpool
            let hosted = CARPOOLS_DATABASE.find(c => c.host === currentUser.name);
            if (!hosted) {
                detailsBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <span style="color:var(--secondary); font-weight:700;">🚗 Host a Carpool:</span>
                        <div class="form-group" style="margin-bottom:0; display:flex; flex-direction:row; align-items:center; gap:10px;">
                            <label style="font-size:0.65rem; margin:0;">Seats Capacity</label>
                            <input type="number" id="host-carpool-seats" min="1" max="6" value="3" style="width:60px; padding:4px 8px; border-radius:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); color:#fff; font-family:inherit;">
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.65rem; margin:0;">Starting Location Route</label>
                            <input type="text" id="host-carpool-route" placeholder="e.g. North Side District -> Oakridge" style="padding:4px 8px; border-radius:6px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); color:#fff; font-family:inherit; font-size:0.75rem;">
                        </div>
                        <button class="btn btn-primary btn-sm glow-btn" id="btn-create-carpool" style="padding:6px; font-size:0.75rem; margin-top:5px; width:100%;">Publish Carpool Route 🚗</button>
                    </div>
                `;

                const createBtn = document.getElementById("btn-create-carpool");
                if (createBtn) {
                    createBtn.addEventListener("click", () => {
                        const seats = parseInt(document.getElementById("host-carpool-seats").value) || 3;
                        const route = document.getElementById("host-carpool-route").value.trim() || "Local Metro -> Sanctuaries";

                        const newCarpool = {
                            id: `carpool-${Math.floor(10 + Math.random() * 90)}`,
                            host: currentUser.name,
                            email: currentUser.email,
                            totalSeats: seats,
                            occupiedSeats: 0,
                            riders: [],
                            route: route
                        };

                        CARPOOLS_DATABASE.push(newCarpool);
                        showToast("Carpool Published! 🚗", `Offering ${seats} seats on route: ${route}`, "🏆");
                        syncTransitUI();
                        renderManagerDashboard();
                    });
                }
            } else {
                detailsBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <div style="color:var(--secondary); font-weight:700;">🚗 Your Active Carpool:</div>
                        <div>Route: ${hosted.route}</div>
                        <div>Capacity: <b>${hosted.occupiedSeats} / ${hosted.totalSeats} seats</b> booked</div>
                        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">Riders: ${hosted.riders.length > 0 ? hosted.riders.join(", ") : "No riders joined yet"}</div>
                    </div>
                `;
            }
        } else if (currentType === "passenger") {
            // Find active carpools
            const availableCarpools = CARPOOLS_DATABASE.filter(c => c.occupiedSeats < c.totalSeats);
            let myJoined = CARPOOLS_DATABASE.find(c => c.riders.includes(currentUser.name));

            if (myJoined) {
                detailsBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <div style="color:var(--primary-accent); font-weight:700;">🚶 Carpool Roster Joined:</div>
                        <div>Driver: <b>${myJoined.host.split(" ")[0]}</b> (${myJoined.email})</div>
                        <div>Route: ${myJoined.route}</div>
                        <button class="btn btn-secondary btn-sm" id="btn-leave-carpool" style="padding:4px; font-size:0.7rem; margin-top:5px; align-self:flex-start;">Leave Carpool</button>
                    </div>
                `;

                const leaveBtn = document.getElementById("btn-leave-carpool");
                if (leaveBtn) {
                    leaveBtn.addEventListener("click", () => {
                        const index = myJoined.riders.indexOf(currentUser.name);
                        if (index !== -1) myJoined.riders.splice(index, 1);
                        myJoined.occupiedSeats = myJoined.riders.length;
                        showToast("Left Carpool", `Relinquished your carpool seat with ${myJoined.host.split(" ")[0]}.`, "🗑️");
                        syncTransitUI();
                        renderManagerDashboard();
                    });
                }
            } else if (availableCarpools.length === 0) {
                detailsBox.innerHTML = `
                    <div style="color:var(--text-muted); font-style:italic; text-align:center; padding:10px;">No available member carpools found. Ride the shuttle or host your own carpool!</div>
                `;
            } else {
                detailsBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <span style="font-weight:700; color:var(--primary-accent);">🚶 Join an Open Carpool:</span>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${availableCarpools.map(c => `
                                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:5px;">
                                    <div style="font-size:0.75rem;">
                                        <b>${c.host.split(" ")[0]}</b> (${c.occupiedSeats}/${c.totalSeats} seats)<br>
                                        <span style="color:var(--text-muted); font-size:0.7rem;">Route: ${c.route}</span>
                                    </div>
                                    <button class="btn btn-primary btn-sm btn-join-carpool" data-join-carpool-id="${c.id}" style="padding:4px 8px; font-size:0.65rem;">Join 🚗</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

                detailsBox.querySelectorAll(".btn-join-carpool").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        const carpoolId = e.target.getAttribute("data-join-carpool-id");
                        const carpool = CARPOOLS_DATABASE.find(c => c.id === carpoolId);
                        if (carpool) {
                            carpool.riders.push(currentUser.name);
                            carpool.occupiedSeats = carpool.riders.length;
                            showToast("Joined Carpool! 🚗", `You are now ridesharing with ${carpool.host.split(" ")[0]}.`, "🏆");
                            syncTransitUI();
                            renderManagerDashboard();
                        }
                    });
                });
            }
        }
    }

    // --- 📚 BOTANICAL REFERENCE LIBRARY CONTROLLER ---

    const librarySearchInput = document.getElementById("library-search-input");
    const readingDrawer = document.getElementById("reading-drawer");
    const btnCloseDrawer = document.getElementById("btn-close-drawer");

    if (librarySearchInput) {
        librarySearchInput.addEventListener("input", () => {
            renderLibrary();
        });
    }

    document.querySelectorAll(".lib-tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".lib-tab-btn").forEach(b => {
                b.classList.remove("active");
                b.style.color = "var(--text-muted)";
                b.style.background = "rgba(255,255,255,0.03)";
                b.style.borderColor = "rgba(255,255,255,0.05)";
            });
            e.target.classList.add("active");
            e.target.style.color = "var(--text-primary)";
            e.target.style.background = "var(--primary)";
            e.target.style.borderColor = "var(--primary)";
            
            renderLibrary();
        });
    });

    const closeDrawerFunc = () => {
        if (readingDrawer) readingDrawer.classList.remove("active");
    };

    if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawerFunc);
    if (readingDrawer) {
        readingDrawer.addEventListener("click", (e) => {
            if (e.target === readingDrawer) closeDrawerFunc();
        });
    }

    function renderLibrary() {
        const container = document.getElementById("bookshelf-container");
        if (!container) return;

        const query = librarySearchInput ? librarySearchInput.value.toLowerCase().trim() : "";
        const activeTab = document.querySelector(".lib-tab-btn.active");
        const activeCategory = activeTab ? activeTab.getAttribute("data-lib-category") : "all";

        const filteredBooks = LIBRARY_DATABASE.filter(book => {
            const matchesQuery = book.title.toLowerCase().includes(query) || 
                                 book.author.toLowerCase().includes(query) || 
                                 book.category.toLowerCase().includes(query);
            const matchesCategory = activeCategory === "all" || book.category === activeCategory;
            return matchesQuery && matchesCategory;
        });

        if (filteredBooks.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:30px; font-size:0.88rem;">No books matched your filter criteria.</div>`;
            return;
        }

        container.innerHTML = filteredBooks.map(book => `
            <div class="book-spine-card" style="background:${book.coverGradient};">
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span class="book-category">${book.category}</span>
                    <h3 class="book-spine-title" style="font-size:0.92rem; line-height:1.2; font-weight:800; margin:5px 0 0 0;">${book.title}</h3>
                    <span class="book-author" style="font-size:0.68rem; opacity:0.75;">By ${book.author}</span>
                </div>
                <div>
                    <span class="book-pages" style="font-size:0.65rem; opacity:0.6;">${book.pages}</span>
                    <button class="btn-read-drawer-trigger" data-book-id="${book.id}">Read Chapter Guides ➜</button>
                </div>
            </div>
        `).join('');

        // Bind Read buttons
        container.querySelectorAll(".btn-read-drawer-trigger").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const bookId = e.target.getAttribute("data-book-id");
                openReadingDrawer(bookId);
            });
        });
    }

    function openReadingDrawer(bookId) {
        const book = LIBRARY_DATABASE.find(b => b.id === bookId);
        if (!book || !readingDrawer) return;

        const drawerContent = document.getElementById("drawer-content-area");
        if (drawerContent) {
            drawerContent.innerHTML = `
                <div class="drawer-book-cover" style="background:${book.coverGradient}; border-radius:8px; padding:15px; margin-bottom:10px;">
                    <span class="book-category" style="color:var(--primary-accent); font-weight:700; font-size:0.65rem;">${book.category.toUpperCase()}</span>
                    <h3 style="font-size:1.05rem; margin-top:8px; line-height:1.3; color:#fff; font-weight:800;">${book.title}</h3>
                    <span style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">By ${book.author}</span>
                </div>

                <div class="drawer-summary-section" style="border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                    <h4 style="font-size:0.75rem; color:var(--primary-accent); font-weight:700; margin-bottom:6px;">Cooperative Guide</h4>
                    <p style="font-size:0.8rem; line-height:1.45; color:var(--text-secondary); margin:0;">Below is a structural chapter overview of this reference literature, compiled for community eco-studies.</p>
                </div>

                <div style="display:flex; flex-direction:column; gap:12px; margin-top:5px; max-height: 250px; overflow-y: auto; padding-right:5px;">
                    ${book.chapters.map((ch, idx) => `
                        <div class="chapter-extract-box" style="padding:10px; background:rgba(0,0,0,0.25); border-left:3px solid var(--primary-accent); border-radius:6px; font-size:0.75rem; line-height:1.4; color:var(--text-secondary);">
                            <strong style="color:var(--primary-accent); display:block; margin-bottom:2px; font-style:normal;">${ch.title}</strong>
                            "${ch.summary}"
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top:15px; border-top:1px dashed rgba(255,255,255,0.08); padding-top:12px; text-align:center;">
                    <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:8px;">Want a physical copy? Reserve in our sanctuaries during expeditions!</p>
                    <button class="btn btn-secondary" id="btn-simulate-borrow" style="width:100%; font-size:0.78rem; padding:8px 12px;">Mark as Borrowed 📖</button>
                </div>
            `;

            const borrowBtn = document.getElementById("btn-simulate-borrow");
            if (borrowBtn) {
                borrowBtn.addEventListener("click", () => {
                    showToast("Book Borrowed! 📖", `Simulating secure digital loan of: "${book.title.substring(0, 20)}..."`, "🏆");
                    if (currentUser) {
                        currentUser.xp += 5;
                        saveUserSession();
                        syncAppState(true);
                    }
                    closeDrawerFunc();
                });
            }
        }

        readingDrawer.classList.add("active");
    }

    // --- 🎡 3D FLIP MEDALS CABINET CONTROLLER ---

    function renderMedalsCabinet() {
        const cabinet = document.getElementById("db-medals-cabinet");
        if (!cabinet || !currentUser) return;

        const seedlingUnlocked = true;
        const myceliumUnlocked = currentUser.xp >= 30;
        const guardianUnlocked = currentUser.xp >= 60;

        cabinet.innerHTML = `
            <!-- Medal 1 -->
            <div class="medal-card-3d">
                <div class="medal-card-inner">
                    <div class="medal-front unlocked">
                        <span class="medal-emoji">🌱</span>
                        <span class="medal-front-title">Sprout</span>
                    </div>
                    <div class="medal-back">
                        <h5 style="margin:0 0 2px 0;">Seedling Sprout</h5>
                        <p style="margin:0;">Default entry pass. Join the club. (Unlocked!)</p>
                    </div>
                </div>
            </div>

            <!-- Medal 2 -->
            <div class="medal-card-3d">
                <div class="medal-card-inner">
                    <div class="medal-front ${myceliumUnlocked ? 'unlocked' : 'locked'}">
                        <span class="medal-emoji">🍄</span>
                        <span class="medal-front-title">Weaver</span>
                    </div>
                    <div class="medal-back">
                        <h5 style="margin:0 0 2px 0;">Mycelium Weaver</h5>
                        <p style="margin:0;">Awarded at 30 XP. Complete tasks and swap seeds. (${myceliumUnlocked ? 'Unlocked!' : 'Locked'})</p>
                    </div>
                </div>
            </div>

            <!-- Medal 3 -->
            <div class="medal-card-3d">
                <div class="medal-card-inner">
                    <div class="medal-front ${guardianUnlocked ? 'unlocked' : 'locked'}">
                        <span class="medal-emoji">🌳</span>
                        <span class="medal-front-title">Guardian</span>
                    </div>
                    <div class="medal-back">
                        <h5 style="margin:0 0 2px 0;">Forest Guardian</h5>
                        <p style="margin:0;">Awarded at 60 XP. Maintain farm grids and stewardship. (${guardianUnlocked ? 'Unlocked!' : 'Locked'})</p>
                    </div>
                </div>
            </div>
        `;
    }

    // --- INITIALIZE BOOT PROCESS ---
    renderFarms();
    renderPantry();
    renderSwapLedger();
    renderLibrary();
    initTransitEvents();
    loadUserSession();
});
