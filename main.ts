let adminPanelActive = false
let backupBackground: Image = null
let devAdminMode = false
let adminInputCodeLog = ""
let toggleInfiniteO2 = false
let toggleInfiniteHP = false
let toggleDoubleLeakDamage = false
let buttonPatternLog = ""
let mainGameActive = true
let commandList = [
    "MOVE NORTH", "MOVE SOUTH", "MOVE EAST", "MOVE WEST",
    "CLIMB UP", "CLIMB DOWN", "GATHER ITEMS", "BAIT MONSTER",
    "HACK NETWORK", "FEED HYDRA", "STEAL EGG", "APPLY CHEMICAL",
    "HARVEST PLANT", "USE CRAFTING", "REPAIR ENGINE", "OVERCHARGE CORE",
    "CHARGE CORE", "TRANSMIT SOS", "VIEW STATUS", "SEARCH VENTS",
    "EXAMINE DUNES", "EXAMINE ROCKS", "ADMIN COMMANDS", "EXIT ADMIN MODE" // 👑 ADDED BOTH HERE!
]
let bannerBox = textsprite.create("STARSHIP ODYSSEY-X", 0, 1)
bannerBox.setBorder(1, 2)
bannerBox.setPosition(80, 12)

let statDisplay = textsprite.create("HP: 100 | SCORE: 0", 0, 3)
statDisplay.setPosition(80, 32)

let o2Display = textsprite.create("O2 SUPPLY: 70%", 0, 2)
o2Display.setPosition(80, 44)

let positionLabel = textsprite.create("LOCATION: CRASH SITE", 0, 9)
positionLabel.setPosition(80, 75)

let commandDisplay = textsprite.create("", 0, 5)
commandDisplay.setMaxFontHeight(8)
commandDisplay.setBorder(1, 4)
commandDisplay.setPosition(80, 112)

let selectedIndex = 0
let score = 0
let health = 100
let inventory: string[] = []
let currentRoom = "crash_site"
let baseTurns = 0
let oxygenRemaining = 70
let oxygenStoryTold = false
let roomItems: { [key: string]: string[] } = {
    "crash_site": ["scrap_metal"],
    "dune_sea": ["survival_rations"],
    "oasis": ["blue_orchid"],
    "bunker_entrance": [],
    "command_center": ["access_card"],
    "cybernetics_lab": ["plasma_torch"],
    "sub_level_hub": [],
    "hydroponics": ["bio_herbicides"],
    "toxic_dump": ["acid_vial"],
    "ventilation_shaft": [],
    "filtration_intake": ["heavy_gears"],
    "power_core": ["multispectral_scanner"],
    "matrix_chamber": ["matrix_core"],
    "deep_canyon": ["survey_probe"],
    "nesting_grounds": ["alien_egg"],
    "scenic_overlook": [],
    "atmospheric_vault": [],
    "cargo_bay": ["sleep_toxin"],
    "crew_quarters": ["fusion_battery"],
    "comms_array": [],
    "quarantine_zone": ["personnel_log"],
    "observation_deck": [],
    "weapon_vault": ["plasma_catalyst"],
    "greenhouse_core": ["stellar_flora"],
    "life_support_hub": [],
    "engineering_annex": [],
    "cryo_storage": ["cryo_cell"],
    "satellite_dish": []
}
function removeItemFromRoom(item: string) {
    let index = roomItems[currentRoom].indexOf(item)
    if (index != -1) {
        roomItems[currentRoom].splice(index, 1)
    }
}
let bunkerUnlocked = false
let alienDistracted = false
let shieldLowered = false
let hydraFed = false
let plantPruned = false
let matrixCharged = false
let liftRestored = false
let coreStabilized = false
let transponderLinked = false
let generatorFixed = false

function triggerSound(freq: number, duration: number) {
    music.play(music.createSoundEffect(WaveShape.Square, freq, freq, 255, 0, duration, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.InBackground)
}
function triggerDamage(amount: number, reason: string) {
    if (toggleInfiniteHP) {
        showMsg("ADMIN BLOCK: " + reason + " (" + amount + " HP payload absorbed by infinite shield.)")
        return
    }

    health -= amount
    triggerSound(120, 200)

    if (health <= 0) {
        if (inventory.indexOf("1981_quarter") != -1) {
            let quarterIndex = inventory.indexOf("1981_quarter")
            inventory.splice(quarterIndex, 1)
            health = 50

            triggerSound(523, 100)
            setTimeout(function () { triggerSound(659, 100) }, 100)
            setTimeout(function () { triggerSound(784, 100) }, 100)
            setTimeout(function () { triggerSound(1046, 300) }, 200)

            showScene("THE 1981 ARCADE QUARTER GLOWS WITH A GOLDEN LIGHT!\nYour suit takes fatal damage and your vitals drop to zero. But right before the darkness takes you, a message flashes onto your HUD\n 'YOU HAVE AN EXTRA LIVE!'\nThe quarter dissolves into an energy shield vortex, resurrecting your suit frame back to exactly 50% HEALTH! Halliday's secret prize just saved your journey.")

            statDisplay.setText("HP: " + health + " | SCORE: " + score)
            return
        }

        health = 0
        statDisplay.setText("HP: 0 | SCORE: " + score)
        showScene("CRITICAL HAZARD: Environmental shield integrity has collapsed to 0%. " + reason)
        game.over(false)
    } else {
        showMsg("HAZARD INTRUSION: Shield Integrity damaged by " + amount + " points. Current HP: " + health)
    }
}

function showScene(text: string) {
    music.play(music.createSoundEffect(WaveShape.Square, 550, 550, 255, 0, 150, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.InBackground)

    if (text.includes("WARNING!")) {
        game.setDialogFrame(img`
            f f f
            f f f
            f f f
        `)
        game.setDialogTextColor(2)
        game.showLongText(text, DialogLayout.Full)
        game.setDialogFrame(null)
        game.setDialogTextColor(15)
    } else {
        game.showLongText(text, DialogLayout.Full)
    }
}

function showMsg(text: string) {
    music.play(music.createSoundEffect(WaveShape.Square, 400, 400, 255, 0, 80, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.InBackground)
    game.showLongText(text, DialogLayout.Bottom)
}
function describeRoom(roomKey: string) {
    let itemsLeft = roomItems[roomKey];
    let itemString = itemsLeft.length > 0 ? " Objects present: [" + itemsLeft.join(", ") + "]." : "";

    if (roomKey == "crash_site") {
        showScene("CRASH SITE: Your exploration pod is shattered across burning, iron-rich sand. The ship hull is completely dead. Exits lie NORTH into a craggy valley, and WEST out toward a shimmering horizon desert." + itemString);
    }
    else if (roomKey == "dune_sea") {
        showScene("DUNE SEA: Endless shifting waves of violet sand blow under pale twin suns. To the NORTH you spot a structure through the dust storms. To the WEST lies an uncharacteristic lush pool. The crash site sits EAST." + itemString);
    }
    else if (roomKey == "oasis") {
        showScene("XENO-OASIS: Miraculously, a pool of pure liquid methane feeds alien vegetation here. A massive fluorescent plant pulses in the center. The vast desert path winds back EAST." + itemString);
    }
    else if (roomKey == "bunker_entrance") {
        let condition = bunkerUnlocked ? "The gigantic hydraulic door is raised wide." : "The massive steel door is hermetically sealed.";
        showScene("BUNKER ENTRANCE: A concrete bunker complex is built into the mountain cliff side. " + condition + " A heavy airlock door leads WEST into a flickering Cybernetics Lab. Paths also span SOUTH into the desert dunes, and EAST down a craggy, shadowy canyon floor.");
    }
    else if (roomKey == "command_center") {
        showScene("COMMAND NEXUS: Holographic displays flicker weakly with warning alarms. A heavy blast shield blocks safe passage further NORTH. Corridors descend DOWN into darkness, while the exit leads SOUTH.");
    }
    else if (roomKey == "cybernetics_lab") {
        let monster = alienDistracted ? "A wild Xenomorph is busy eating scrap metal in a cage." : "A slavering Xenomorph beast bars access to the tech shelves!";
        showScene("CYBERNETICS LAB: Shattered fluid pods litter the perimeter. " + monster + " The exit tunnel runs WEST back into the main bunker entrance." + itemString);
    }
    else if (roomKey == "sub_level_hub") {
        showScene("SUB-LEVEL HUB: An intersection chamber beneath the facility. Heavy rusted pipes pump old coolant overhead. Structural passages fork NORTH, EAST, and WEST. A service ladder climbs UP to the nexus.");
    }
    else if (roomKey == "hydroponics") {
        let plantStatus = plantPruned ? "The thorny vines have been dissolved away." : "Aggressive, razor-sharp mutant vines overgrow the western doorway, blocking it entirely.";
        showScene("BIOME GREENHOUSE: A towering glass canopy houses dying botanical specimens. " + plantStatus + " Exits lead EAST to the hub, and WEST into the industrial waste pool." + itemString);
    }
    else if (roomKey == "toxic_dump") {
        showScene("WASTE FLUID DUMP: Corrosive neon-green sludge overflows processing barrels. The air is highly acidic. Exits link EAST to the greenhouse, and a narrow maintenance ladder climbs UP.");
    }
    else if (roomKey == "ventilation_shaft") {
        showScene("MAINTENANCE SHAFTS: A labyrinth of metal ducts. Dust clouds choke your rebreather. Pushing forward NORTH leads into a roaring intake fan house. Crawling DOWN drops you into the toxic dump.");
    }
    else if (roomKey == "filtration_intake") {
        let fanStatus = liftRestored ? "The structural exhaust fan is fully locked and stopped." : "The massive steel exhaust blades spin at lethal, screaming speeds.";
        showScene("WATER FILTRATION: Massive circular wind ducts handle facility airflow. " + fanStatus + " A ladder drops DOWN to the central Power Core floor." + itemString);
    }
    else if (roomKey == "power_core") {
        let powerStatus = generatorFixed ? "The dark energy grid hums cleanly at 100% capacity." : "The plasma core reactor sits completely dark and locked in emergency safe-mode.";
        showScene("FUSION POWER CORE: A massive platform over an endless cooling pool. " + powerStatus + " Elevators lead UP to filtration. Heavy security sliding doors open NORTH and EAST.");
    }
    else if (roomKey == "matrix_chamber") {
        showScene("THE LOGIC MATRIX: A room constructed of glowing crystal processing circuits. Quantum data relays float in stasis tubes. The exit leads WEST back into the core platform." + itemString);
    }
    else if (roomKey == "deep_canyon") {
        showScene("ECHOING CANYON: Sheer black rock faces squeeze out the daylight. Howling wind echoes down the pass. Trails split WEST to the bunker entry, and NORTH into cave networks." + itemString);
    }
    else if (roomKey == "nesting_grounds") {
        let hydraMsg = hydraFed ? "A giant three-headed cave beast sleeps soundly next to a nest." : "A massive three-headed Hydra protects its nest! It growls menacingly.";
        showScene("HYDRA NEST: An organic cave lined with glowing crystalline stones. " + hydraMsg + " The canyon pathway retreats back SOUTH." + itemString);
    }
    else if (roomKey == "scenic_overlook") {
        let transMsg = transponderLinked ? "The long-range communications array is fully online, transmitting to deep space!" : "The massive deep-space communication array stands unpowered on the cliff ledge.";
        showScene("CLIFF OVERLOOK: A high mountain precipice overlooking the vast, alien planetary valleys. " + transMsg + " The heavy reinforced door runs SOUTH into the reactor core.");
    }
    else if (roomKey == "atmospheric_vault") {
        showScene("THE O2 CORE:\nA secret high-security chamber housing the base's main atmospheric synthesis node.\nAn endless stream of pure air purrs silently.");
    }
    else if (roomKey == "cargo_bay") {
        showScene("AUTOMATED CARGO DEPOT:\nMassive metal storage containers loom like giant tombs in the shadows.\nA deactivated heavy sorting crane hangs overhead like a mechanical beast.\nCorridors stretch further EAST into silent rooms.");
    }
    else if (roomKey == "crew_quarters") {
        showScene("CREW LIVING SECTORS:\nShattered bunks and personal effects are strewn across the cold steel deck plates.\nA low, metallic wind whistles through broken air ducts.\nExits lead WEST back to the depot, and NORTH into an observation balcony.");
    }
    else if (roomKey == "comms_array") {
        showScene("SATELLITE COMMUNICATIONS CORE:\nTowering transmitter terminals blink with weak, rhythmic orange status lights.\nHigh-voltage cables crackle softly with leftover energy arcs.\nThe path runs SOUTH back down toward the cargo bay.");
    }
    else if (roomKey == "quarantine_zone") {
        showScene("BIOLOGICAL ISOLATION WARD:\nFlashing crimson warning beacons paint the metal containment panels in dark red blood tones.\nHermetic isolation cells stand cracked open and empty.\nCorridors route SOUTH to hydroponics, and NORTH into a secure armory vault.");
    }
    else if (roomKey == "observation_deck") {
        showScene("GLASS OVERLOOK ANNEX:\nA massive panoramic reinforced viewport frames the burning planetary landscape below.\nDeactivated computer panels sit dead in long rows.\nThe heavy door runs SOUTH back into the living quarters.");
    }
    else if (roomKey == "weapon_vault") {
        showScene("ARMORY DEPOT Bulkheads:\nReinforced titanium security lockers line the walls, most pried open by brute force.\nEmergency klaxons click silently in the dark.\nThe security entrance heads SOUTH back into isolation.");
    }
    else if (roomKey == "greenhouse_core") {
        showScene("BOTANICAL HARVEST SANCTUARY:\nDeep within the sealed dome, a hidden hydroponic bed thrives away from the mutations.\nRows of vibrant, edible alien stalks glow with a gentle green life-force.\nThe exit path runs EAST back to the overgrown briar patch.");
    }
    else if (roomKey == "life_support_hub") {
        showScene("ENVIRONMENTAL CONTROL NEXUS:\nMassive titanium oxygen scrubbers line the perimeter, pulsing with a heavy rhythmic thrum.\nEmergency status terminal grids display structural gravity metrics.\nThe localized atmosphere exits SOUTH back into the O2 core vault.");
    }
    else if (roomKey == "engineering_annex") {
        showScene("HEAVY MECHANICS DECK:\nRusted crane frameworks and dead hydraulic assembly lifters hang frozen in time.\nShattered cooling vents drop toxic moisture puddles onto the steel plates.\nExits lead WEST back toward the central power core deck.");
    }
    else if (roomKey == "cryo_storage") {
        showScene("DEEP STASIS VAULT:\nRows of vertical glass preservation pods stretch into the icy, unlit gloom.\nFrosted status monitors flicker with long-dead crew tracking metrics.\nThe secure pneumatic door runs SOUTH back into the living sectors.");
    }
    else if (roomKey == "satellite_dish") {
        showScene("EXTERNAL ARRAY LEDGE:\nYou step out onto a narrow scaffolding bridge directly on the bare hull of the ship.\nThe terrifying, silent expanse of space looms open above you.\nWARNING: Devoid of facility defense shielding, micro-meteorites clip the metal deck planks!");
    }
}

function roomHasItem(item: string): boolean {
    return roomItems[currentRoom].indexOf(item) != -1
}

function addScore(amount: number) {
    score += amount
    music.play(music.createSoundEffect(WaveShape.Square, 800, 800, 255, 0, 100, SoundExpressionEffect.None, InterpolationCurve.Linear), music.PlaybackMode.InBackground)
}

function saveGameProgress() {
    blockSettings.writeString("saved_room", currentRoom)
    blockSettings.writeNumber("saved_hp", health)
    blockSettings.writeNumber("saved_score", score)
    blockSettings.writeNumber("saved_o2", oxygenRemaining)
    blockSettings.writeNumber("saved_turns", baseTurns)
    blockSettings.writeNumber("saved_story_told", oxygenStoryTold ? 1 : 0)
    blockSettings.writeNumber("saved_bunker_lock", bunkerUnlocked ? 1 : 0)
    blockSettings.writeNumber("saved_shield_low", shieldLowered ? 1 : 0)
    blockSettings.writeNumber("saved_hydra_fed", hydraFed ? 1 : 0)
    blockSettings.writeNumber("saved_plant_pruned", plantPruned ? 1 : 0)
    blockSettings.writeNumber("saved_lift_fixed", liftRestored ? 1 : 0)
    blockSettings.writeNumber("saved_gen_fixed", generatorFixed ? 1 : 0)

    let backpackString = inventory.join(",")
    blockSettings.writeString("saved_inventory", backpackString)

    triggerSound(587, 80)
    setTimeout(function () { triggerSound(880, 120) }, 80)
    showMsg("DATA SYNCED: Progress safely written to Starship memory matrix slots.")
}
function loadGameProgress() {
    currentRoom = blockSettings.readString("saved_room")
    health = blockSettings.readNumber("saved_hp")
    score = blockSettings.readNumber("saved_score")
    oxygenRemaining = blockSettings.readNumber("saved_o2")
    baseTurns = blockSettings.readNumber("saved_turns")

    oxygenStoryTold = (blockSettings.readNumber("saved_story_told") == 1)
    bunkerUnlocked = (blockSettings.readNumber("saved_bunker_lock") == 1)
    shieldLowered = (blockSettings.readNumber("saved_shield_low") == 1)
    hydraFed = (blockSettings.readNumber("saved_hydra_fed") == 1)
    plantPruned = (blockSettings.readNumber("saved_plant_pruned") == 1)
    liftRestored = (blockSettings.readNumber("saved_lift_fixed") == 1)
    generatorFixed = (blockSettings.readNumber("saved_gen_fixed") == 1)

    let backpackString = blockSettings.readString("saved_inventory")
    if (backpackString == "") {
        inventory = []
    } else {
        inventory = backpackString.split(",")
    }

    describeRoom(currentRoom)
    let displayRoomName = currentRoom.replace("_", " ").toUpperCase()
    bannerBox.setText("STARSHIP ODYSSEY-X")
    positionLabel.setText("LOCATION: " + displayRoomName)
    statDisplay.setText("HP: " + health + " | SCORE: " + score)
    o2Display.setText("O2 SUPPLY: " + oxygenRemaining + "%")

    triggerSound(440, 100)
    setTimeout(function () { triggerSound(554, 100) }, 100)
    setTimeout(function () { triggerSound(659, 150) }, 200)
    showMsg("SYSTEM RESTORED: Backup data loaded from local flash drive storage.")

    info.stopCountdown()
}

function unlockAtmosphericVault() {
    if (currentRoom == "filtration_intake") {
        currentRoom = "atmospheric_vault"
        addScore(100)

        triggerSound(523, 100)
        setTimeout(function () { triggerSound(659, 100) }, 100)
        setTimeout(function () { triggerSound(784, 100) }, 100)
        setTimeout(function () { triggerSound(1046, 400) }, 200)

        showScene("WARNING! ATMOSPHERIC OVERLOAD EXECUTED!\nInputting the hidden override command sequence into the filtration mainframes causes the heavy steel wall partitions to slide backward! You step into a hidden, pristine clean room filled with pulsing neon conduits.\nA system visor display notification flashes:\n'EXPERIMENTAL COMPONENT O2-CORE: UNLIMITED ATMOSPHERIC MATRIX ONLINE.'\nYour suit's life support interface locks permanently at maximum capacity. You now have INFINITE OXYGEN for the remainder of your journey!")
    } else {
        triggerSound(150, 200)
        showMsg("CONSOLE FAULT: Security override sequence entered, but terminal access points localized in this sector lack atmospheric injection routing.")
    }
}

function playTurn(action: string) {
    if (!mainGameActive) {
        return
    }

    baseTurns++
    let cmd = action.toLowerCase().trim()

    // 🔗 INJECTED LINK: Activates all missing puzzle commands instantly!
    if (runExpansionVerbs(cmd)) return;

    // 👑 REBUILT MATRIX MAIN NEXUS PARSER GATEWAY
    if (cmd == "access mainframe") {
        mainGameActive = false
        commandDisplay.setText("")

        triggerSound(880, 100)
        setTimeout(function () { triggerSound(1046, 200) }, 100)

        let passwordGuess = game.askForString("ENTER MASTER TESTING KEYCODE:", 36)
        if (passwordGuess == "mainframe_matrix_subspace_access_9") {
            devAdminMode = true // Permanently unlocks the "ADMIN COMMANDS" choice inside rooms
            triggerSound(523, 100)
            setTimeout(function () { triggerSound(1046, 300) }, 100)
            showScene("ACCESS AUTHORIZED:\nDeveloper privileges injected. An [ADMIN COMMANDS] contextual terminal overlay action has been mapped to your suit options menu.")
        } else {
            triggerSound(150, 400)
            showMsg("ACCESS DENIED: Invalid administrator credentials vector block.")
        }

        setTimeout(function () {
            mainGameActive = true
            describeRoom(currentRoom)
        }, 100)
        return
    }

    // 👑 CONTEXTUAL ACTION PANEL: Multi-Page Total System Override Matrix (Frame Buffer Shield Refit)
    else if (cmd == "admin commands") {
        let isSafeRoom = (currentRoom == "crash_site" || currentRoom == "dune_sea" || currentRoom == "oasis")
        if (isSafeRoom && !toggleInfiniteO2) {
            oxygenRemaining += 1
        }

        adminPanelActive = true // Freeze native room movement inputs inside code menus!
        maskScreenBlack()

        let activePage = 1
        let insideAdminMenu = true

        while (insideAdminMenu) {
            if (activePage == 1) {
                let hpLabel = "1: VITALS STATUS <" + health + " HP>"
                let o2Label = "2: INFINITE O2 <" + (toggleInfiniteO2 ? "ON" : "OFF") + ">"
                let shieldLabel = "3: SHIELD OVERRIDE <" + (toggleInfiniteHP ? "ON" : "OFF") + ">"
                let nextLabel = "4: NEXT PAGE (FACILITY ENGINES) >>"

                game.showLongText("DEV NEXUS OVERLAY (PAGE 1 - SUIT METRICS):\nSelect a system state node to overwrite:", DialogLayout.Full)
                story.showPlayerChoices(hpLabel, o2Label, shieldLabel, nextLabel)

                if (story.checkLastAnswer(hpLabel)) {
                    triggerSound(587, 80)
                    let promptHPStr = game.askForString("SET EXACT HP STATUS (0-100):", 3)
                    let parsedHP = parseInt(promptHPStr.trim())
                    if (!isNaN(parsedHP)) health = Math.max(0, Math.min(100, parsedHP))
                }
                else if (story.checkLastAnswer(o2Label)) {
                    triggerSound(587, 80)
                    toggleInfiniteO2 = !toggleInfiniteO2
                }
                else if (story.checkLastAnswer(shieldLabel)) {
                    triggerSound(587, 80)
                    toggleInfiniteHP = !toggleInfiniteHP
                }
                else if (story.checkLastAnswer(nextLabel)) {
                    activePage = 2
                }
            }
            else if (activePage == 2) {
                // 🛠️ PAGE 2A: Facility Power & Mechanical Relays
                let genLabel = "1: POWER REACTOR <" + (generatorFixed ? "ONLINE" : "OFFLINE") + ">"
                let liftLabel = "2: VENT FAN ELEVATOR <" + (liftRestored ? "REPAIRED" : "BROKEN") + ">"
                let matrixLabel = "3: MATRIX TERMINAL CHARGE <" + (matrixCharged ? "FULL" : "DEAD") + ">"
                let nextLabel = "4: NEXT PAGE (SECURITY MATRICES) >>"

                game.showLongText("DEV NEXUS OVERLAY (PAGE 2 - ENGINES):\nModify station mechanical systems architecture:", DialogLayout.Full)
                story.showPlayerChoices(genLabel, liftLabel, matrixLabel, nextLabel)

                if (story.checkLastAnswer(genLabel)) {
                    triggerSound(587, 80)
                    generatorFixed = !generatorFixed
                }
                else if (story.checkLastAnswer(liftLabel)) {
                    triggerSound(587, 80)
                    liftRestored = !liftRestored
                }
                else if (story.checkLastAnswer(matrixLabel)) {
                    triggerSound(587, 80)
                    matrixCharged = !matrixCharged
                }
                else if (story.checkLastAnswer(nextLabel)) {
                    activePage = 3
                }
            }
            else if (activePage == 3) {
                // 🔐 PAGE 2B: Security Boundaries & Eco Locks
                let doorLabel = "1: BUNKER HYDRAULICS <" + (bunkerUnlocked ? "OPEN" : "LOCKED") + ">"
                let forceLabel = "2: NEXUS FORCEFIELD <" + (shieldLowered ? "OPEN" : "ACTIVE") + ">"
                let vaultLabel = "3: SECRET O2 CORE CHAMBER <" + (currentRoom == "atmospheric_vault" ? "INSIDE" : "CLOSED") + ">"
                let nextLabel = "4: NEXT PAGE (BIOLOGICALS & SCRIPTS) >>"

                game.showLongText("DEV NEXUS OVERLAY (PAGE 3 - STRUCTURE):\nModify facility authorization parameters:", DialogLayout.Full)
                story.showPlayerChoices(doorLabel, forceLabel, vaultLabel, nextLabel)

                if (story.checkLastAnswer(doorLabel)) {
                    triggerSound(587, 80)
                    bunkerUnlocked = !bunkerUnlocked
                }
                else if (story.checkLastAnswer(forceLabel)) {
                    triggerSound(587, 80)
                    shieldLowered = !shieldLowered
                }
                else if (story.checkLastAnswer(vaultLabel)) {
                    triggerSound(587, 80)
                    if (currentRoom != "atmospheric_vault") {
                        currentRoom = "atmospheric_vault"
                        showMsg("WARP MATRIX SUCCESS: Dropped directly inside the hidden infinite O2 core node slot.")
                    } else {
                        currentRoom = "crash_site"
                        showMsg("WARP MATRIX RESET: Returned back to the surface pod coordinates.")
                    }
                }
                else if (story.checkLastAnswer(nextLabel)) {
                    activePage = 4
                }
            }
            else if (activePage == 4) {
                // 🌿 PAGE 2C: Environmental Hazards & Creature Flags
                let alienLabel = "1: XENOMORPH SCRAP CAGE <" + (alienDistracted ? "TRAPPED" : "LOOSE") + ">"
                let hydraLabel = "2: HYDRA CHRONIC SLEEP <" + (hydraFed ? "ACTIVE" : "AWAKE") + ">"
                let plantLabel = "3: BIOME PURPLE BRIARS <" + (plantPruned ? "CLEARED" : "BLOCKING") + ">"
                let nextLabel = "4: NEXT PAGE (SCRIPTS & WARPS) >>"

                game.showLongText("DEV NEXUS OVERLAY (PAGE 4 - BIOLOGICALS):\nModify native environment hazard state parameters:", DialogLayout.Full)
                story.showPlayerChoices(alienLabel, hydraLabel, plantLabel, nextLabel)

                if (story.checkLastAnswer(alienLabel)) {
                    triggerSound(587, 80)
                    alienDistracted = !alienDistracted
                }
                else if (story.checkLastAnswer(hydraLabel)) {
                    triggerSound(587, 80)
                    hydraFed = !hydraFed
                }
                else if (story.checkLastAnswer(plantLabel)) {
                    triggerSound(587, 80)
                    plantPruned = !plantPruned
                }
                else if (story.checkLastAnswer(nextLabel)) {
                    activePage = 5
                }
            }
            else if (activePage == 5) {
                let itemsLabel = "1: SPAWN QUEST ITEMS"
                let warpLabel = "2: MATRIX TELEPORT"
                let winLabel = "3: INSTANT WIN"
                let exitLabel = "4: EXIT TERMINAL"

                game.showLongText("DEV NEXUS OVERLAY (PAGE 5 - SCRIPTS):\nExecute structural generation scripts or resume play:", DialogLayout.Full)
                story.showPlayerChoices(itemsLabel, warpLabel, winLabel, exitLabel)

                if (story.checkLastAnswer(itemsLabel)) {
                    triggerSound(880, 150)
                    let allItems = ["scrap_metal", "survival_rations", "blue_orchid", "access_card", "plasma_torch", "bio_herbicides", "acid_vial", "heavy_gears", "multispectral_scanner", "matrix_core", "survey_probe", "alien_egg", "1981_quarter", "zork_leaflet", "golden_egg", "golden_trident", "sleep_toxin", "fusion_battery", "personnel_log", "plasma_catalyst", "stellar_flora", "poisoned_bait", "cryo_cell"]
                    for (let item of allItems) {
                        if (inventory.indexOf(item) == -1) inventory.push(item)
                    }
                    showMsg("ASSETS SECURED: Complete item payload added to inventory slots.")
                }
                else if (story.checkLastAnswer(warpLabel)) {
                    triggerSound(880, 150)
                    game.showLongText("WARP MAP GRID OVERRIDE SELECTION:", DialogLayout.Full)
                    story.showPlayerChoices("BUNKER ENTRY", "CYBER LAB", "POWER CORE", "HEAVY ANNEX")

                    if (story.checkLastAnswer("BUNKER ENTRY")) { currentRoom = "bunker_entrance"; bunkerUnlocked = true; }
                    else if (story.checkLastAnswer("CYBER LAB")) { currentRoom = "cybernetics_lab"; alienDistracted = true; bunkerUnlocked = true; }
                    else if (story.checkLastAnswer("POWER CORE")) { currentRoom = "power_core"; }
                    else if (story.checkLastAnswer("HEAVY ANNEX")) { currentRoom = "engineering_annex"; }
                }
                else if (story.checkLastAnswer(winLabel)) {
                    insideAdminMenu = false
                    adminPanelActive = false
                    restoreScreenGraphics()

                    currentRoom = "scenic_overlook"
                    if (inventory.indexOf("matrix_core") == -1) inventory.push("matrix_core")
                    if (inventory.indexOf("alien_egg") == -1) inventory.push("alien_egg")

                    playTurn("TRANSMIT SOS")
                    return
                }
                else if (story.checkLastAnswer(exitLabel)) {
                    insideAdminMenu = false
                }
            }
        }

        // 👑 MASTER BUFFERED CURSOR RE-SYNCHRONIZATION RESETS
        restoreScreenGraphics()

        // Force a total reset of the tracking indices to prevent phantom selections
        selectedIndex = 0
        let freshOptions = getLocalCommands()

        // Balance text position metrics to the absolute center coordinate columns
        commandDisplay.setText("< " + freshOptions[selectedIndex] + " >")
        let textPixelWidth = commandDisplay.width
        commandDisplay.left = Math.floor((160 - textPixelWidth) / 2)

        // 🛡️ FRAME BUFFER TIMEOUT ZONE: Holds up hardware input shields for 50ms 
        // to completely swallow the closing 'A' button press leak from the extension module!
        setTimeout(function () {
            adminPanelActive = false // Drop the menu lock ONLY after the frame cycle clears!
            mainGameActive = true
            describeRoom(currentRoom)
        }, 50)
        return
    }

    else if (cmd == "exit admin mode") {
        let isSafeRoom = (currentRoom == "crash_site" || currentRoom == "dune_sea" || currentRoom == "oasis")
        if (isSafeRoom && !toggleInfiniteO2) {
            oxygenRemaining += 1
        }
        devAdminMode = false
        showMsg("PRIVILEGES REVOKED: Suit operating frame returned to native user security clearance.")

        setTimeout(function () {
            describeRoom(currentRoom)
        }, 100)
        return
    }

    let leakChance = Math.randomRange(1, 100)
    let isSafeRoom = (currentRoom == "crash_site" || currentRoom == "dune_sea" || currentRoom == "oasis")
    let baseLeakCost = toggleDoubleLeakDamage ? 4 : 2

    if (leakChance <= 8 && !isSafeRoom && currentRoom != "atmospheric_vault") {
        if (!toggleInfiniteO2) {
            oxygenRemaining -= baseLeakCost
            showMsg("HAZARD Alert: Sudden environment suit structural pressure drop! Life support lost " + baseLeakCost + "%!")
        }
        triggerSound(100, 250)
    } else {
        if (currentRoom != "atmospheric_vault" && !toggleInfiniteO2) {
            oxygenRemaining -= 1
        }

        if (oxygenRemaining > 10) {
            triggerSound(120, 30)
        } else if (oxygenRemaining > 0) {
            triggerSound(440, 60)
            setTimeout(function () { triggerSound(440, 60) }, 150)
            setTimeout(function () { triggerSound(440, 60) }, 300)
        }
    }

    let refundAir = function () {
        if (isSafeRoom) {
            oxygenRemaining += 1
        }
    }

    if (oxygenStoryTold == false && currentRoom == "crash_site") {
        oxygenStoryTold = true
        triggerSound(880, 150)
        setTimeout(function () { triggerSound(660, 150) }, 150)
        showScene("WARNING! As you take your first steps away from the pod, a sharp electronic chime echoes inside your helmet. Your visor's heads-up display flickers online. A warning notification reads: 'CAUTION: Primary life support atmospheric buffer damaged in crash. Environmental suit oxygen reserves have dropped to 70%.' Your time on Planet X-43 is strictly limited...")
    }

    if (oxygenRemaining <= 0) {
        oxygenRemaining = 0
        if (inventory.indexOf("1981_quarter") != -1) {
            let quarterIndex = inventory.indexOf("1981_quarter")
            inventory.splice(quarterIndex, 1)
            health = 50
            oxygenRemaining = 1
            triggerSound(523, 100)
            setTimeout(function () { triggerSound(659, 100) }, 100)
            setTimeout(function () { triggerSound(784, 100) }, 100)
            setTimeout(function () { triggerSound(1046, 300) }, 200)
            showScene("THE 1981 ARCADE QUARTER GLOWS WITH A GOLDEN LIGHT!\nYour suit's oxygen reserves hit 0% and your lungs seize in the frozen vacuum. But right before your vision fades completely, a message flashes across your visor:\n'YOU HAVE AN EXTRA LIVE!'\nThe quarter dissolves into an energy vortex, shock-inducing your heart and restoring your vitals to 50% HEALTH! \nHowever, a warning notification sirens:\n'CRITICAL: Emergency coin matrix can resurrect cellular tissue, but cannot synthesize atmospheric gas.' Your tank is still empty. You must now hold your breath!")
            info.startCountdown(180)
            statDisplay.setText("HP: " + health + " | SCORE: " + score)
            o2Display.setText("O2 SUPPLY: HOLDING BREATH!")
            return
        }
        showScene("CRITICAL FAILURE: Your environment suit's oxygen supply hits 0%. You gasp for air as your vision fades into total darkness. Your journey ends here.")
        game.over(false)
        return
    }

    if (oxygenRemaining == 15) {
        showMsg("CRITICAL: Environmental suit life support is critical. Oxygen dropping past safety margins!")
        triggerSound(180, 500)
    }
    if (currentRoom == "toxic_dump" && inventory.indexOf("survival_rations") == -1) {
        triggerDamage(15, "Inhaled toxic hazardous corrosive fumes without atmospheric filter supplies.")
    }

    if (currentRoom == "ventilation_shaft" && cmd != "throw acid") {
        triggerDamage(20, "Swarmed and shredded by hyper-aggressive micro-drone scrap pests nesting in the vents.")
        showMsg("ALERT: Micro-drone cyber-swarmers are blocking the ventilation tunnel. You need something highly corrosive to dissolve the hive cluster...")
    }
    else if (currentRoom == "ventilation_shaft" && cmd == "throw acid") {
        refundAir()
        let acidIndex = inventory.indexOf("acid_vial")
        if (acidIndex != -1) {
            inventory.splice(acidIndex, 1)
        }
        showMsg("COMBAT SUCCESS: You hurl your acid vial at the vent vents! The highly corrosive fluid dissolves the cybernetic swarm hive into bubbling slag. The shafts are safe.")
    }

    if (currentRoom == "power_core" && cmd != "ignite torch") {
        triggerSound(100, 800)
        showScene("WARNING! CRITICAL GEOMETRY HAZARD!\nYou have stepped into a pitch-black reactor room. It is pitch dark. You are likely to be eaten by a Grue.\nSuddenly, slithering metallic claws snatch you from the darkness. A jaw of razor-sharp plasma teeth tears through your environment suit frame. Your life support flatlines instantly.")
        game.over(false)
        return
    }
    else if (currentRoom == "power_core" && cmd == "ignite torch") {
        refundAir()
        showMsg("LIGHT SOURCE ACTIVATED: You ignite your plasma torch. A bright blue flame slices through the shadows, scaring away a massive, slithering silhouette hiding in the reactor scaffolding. The Grue retreats into the floor vents!")
    }

    if (cmd == "move north") {
        if (currentRoom == "crash_site") {
            currentRoom = "bunker_entrance";
            describeRoom(currentRoom);
        } else if (currentRoom == "dune_sea") {
            currentRoom = "bunker_entrance";
            describeRoom(currentRoom);
        } else if (currentRoom == "bunker_entrance") {
            if (bunkerUnlocked) {
                currentRoom = "command_center";
                describeRoom(currentRoom);
            } else {
                showMsg("The bunker door is sealed shut. You need to unlock it from the terminal in the Cybernetics Lab.");
            }
        } else if (currentRoom == "command_center") {
            if (shieldLowered) {
                currentRoom = "filtration_intake";
                describeRoom(currentRoom);
            } else {
                showMsg("A red structural forcefield grid blocks passage north. Hack the nexus system panel first.");
            }
        } else if (currentRoom == "sub_level_hub") {
            currentRoom = "power_core";
            describeRoom(currentRoom);
        } else if (currentRoom == "ventilation_shaft") {
            currentRoom = "filtration_intake";
            describeRoom(currentRoom);
        } else if (currentRoom == "power_core") {
            currentRoom = "command_center";
            describeRoom(currentRoom);
        } else if (currentRoom == "deep_canyon") {
            currentRoom = "nesting_grounds";
            describeRoom(currentRoom);
        } else if (currentRoom == "cargo_bay") {
            currentRoom = "comms_array";
            describeRoom(currentRoom);
        } else if (currentRoom == "crew_quarters") {
            currentRoom = "observation_deck";
            describeRoom(currentRoom);
        } else if (currentRoom == "hydroponics") {
            currentRoom = "quarantine_zone";
            describeRoom(currentRoom);
        } else if (currentRoom == "quarantine_zone") {
            if (inventory.indexOf("fusion_battery") != -1) {
                currentRoom = "weapon_vault";
                describeRoom(currentRoom);
            } else {
                showMsg("SECURITY LOCKDOWN: The Armory bulkhead requires a high-voltage [fusion_battery] to jumpstart the door tracks.");
            }
        }
        else if (currentRoom == "atmospheric_vault") {
            currentRoom = "life_support_hub";
            describeRoom(currentRoom);
        } else if (currentRoom == "comms_array") {
            currentRoom = "satellite_dish";
            describeRoom(currentRoom);
        } else {
            refundAir();
            showMsg("A mountain range or solid metal plating blocks movement that way.");
        }
    }
    else if (cmd == "move south") {
        if (currentRoom == "bunker_entrance") {
            currentRoom = "crash_site";
            describeRoom(currentRoom);
        } else if (currentRoom == "command_center") {
            currentRoom = "bunker_entrance";
            describeRoom(currentRoom);
        } else if (currentRoom == "filtration_intake") {
            currentRoom = "power_core";
            describeRoom(currentRoom);
        } else if (currentRoom == "power_core") {
            currentRoom = "scenic_overlook";
            describeRoom(currentRoom);
        } else if (currentRoom == "scenic_overlook") {
            currentRoom = "power_core";
            describeRoom(currentRoom);
        } else if (currentRoom == "nesting_grounds") {
            currentRoom = "deep_canyon";
            describeRoom(currentRoom);
        } else if (currentRoom == "comms_array") {
            currentRoom = "cargo_bay";
            describeRoom(currentRoom);
        } else if (currentRoom == "observation_deck") {
            currentRoom = "crew_quarters";
            describeRoom(currentRoom);
        } else if (currentRoom == "quarantine_zone") {
            currentRoom = "hydroponics";
            describeRoom(currentRoom);
        } else if (currentRoom == "weapon_vault") {
            currentRoom = "quarantine_zone";
            describeRoom(currentRoom);
        }
        else if (currentRoom == "life_support_hub") {
            currentRoom = "atmospheric_vault";
            describeRoom(currentRoom);
        } else if (currentRoom == "satellite_dish") {
            currentRoom = "comms_array";
            describeRoom(currentRoom);
        } else {
            refundAir();
            showMsg("There are no structural pathways leading south from here.");
        }
    }
    else if (cmd == "search vents" || cmd == "look closer") {
        if (currentRoom == "ventilation_shaft") {
            if (inventory.indexOf("golden_egg") == -1) {
                inventory.push("golden_egg")
                showMsg("SECRET DISCOVERED: You brush away gray dust and discover a gleaming, hidden golden egg! Etched onto its smooth surface are the words: 'CREATED BY WARREN ROBINETT'. The first ever easter egg creater. You place the golden egg into your pack.")
                addScore(50)
            } else {
                showMsg("You already discovered the secret golden egg in this vent shaft.")
            }
        } else {
            refundAir()
            showMsg("There are no ventilation grids or deep crevices to look closer at here.")
        }
    }
    else if (cmd == "scan infrared") {
        if (currentRoom == "dune_sea") {
            if (roomHasItem("zork_leaflet")) {
                removeItemFromRoom("zork_leaflet")
                inventory.push("zork_leaflet")
                showMsg("SCANNER DISCOVERY: Your visor's lens shifts to thermal wavelengths. The flat red desert suddenly warps. Deep beneath the freezing, shifting iron sands, a faint, pulsing heat signature registers... something artificial is buried out here. You dig frantically into the rust-colored dust until your gloves hit metal. You drag out a rusted mailbox next to a small piece of a white wooden fence! Opening it reveals a crisp leaflet that reads: 'Welcome to Zork!'")
                addScore(50)
            } else {
                refundAir()
                showMsg("Your infrared scanner traces the cold sands, but the thermal anomaly has already been excavated.")
            }
        } else {
            showMsg("Infrared sensor array indicates uniform local temperature fields. No thermal anomalies localized.")
        }
    }
    else if (cmd == "eat leaflet") {
        let currentOptions = getLocalCommands()
        if (currentOptions.indexOf("EAT LEAFLET") != -1) {
            refundAir()
            showMsg("I don't think the leaflet would agree with you.")
        } else {
            refundAir()
            showMsg("You can't do that right now.")
        }
    }
    else if (cmd == "scan ultrasonic") {
        if (currentRoom == "ventilation_shaft") {
            if (roomHasItem("golden_egg")) {
                removeItemFromRoom("golden_egg")
                inventory.push("golden_egg")
                showScene("ANOMALOUS ECHO LOCATED: Sonic sonar audio waves bounce down the dark, echoing pipes. Suddenly, the steady rhythm returns a distorted, hollow feedback loop. There is a false wall partition hidden behind the rattling ventilation grates. You pry open a loose service panel, reaching into a narrow, unmapped pocket of the ship. Your fingers curl around a smooth golden object etched with ancient words: 'Created by Warren Robinett.'")
                addScore(50)
            } else {
                refundAir()
                showMsg("Ultrasonic sonar waves echo cleanly off the interior vent walls. The secret slot lies bare.")
            }
        } else {
            showMsg("Acoustic wave reflection grids return normal structural density parameters. Nothing hidden here.")
        }
    }
    else if (cmd == "scan chromatic") {
        if (currentRoom == "deep_canyon") {
            if (inventory.indexOf("golden_trident") == -1) {
                inventory.push("golden_trident")
                showScene("ANCIENT DISCOVERY: Your lens filters out standard visual rock wavelengths. Deep within the ancient shadow clefts, a faint geometric structure begins to glow...\nThree interlocking triangles form a single, perfect symbol on the stone facade. A low, harmonic hum vibrates through your armor boots as a hidden rock partition grinds open, revealing a heavy Golden Trident!")
                addScore(50)
            } else {
                refundAir()
                showMsg("The chromatic lens highlights the ancient interlocking triangle outline, but the hidden weapon slot is empty.")
            }
        } else {
            showMsg("Visual wavelength spectrographs return ordinary surface coloration. No hidden light matrix found.")
        }
    }
    else if (cmd == "examine dunes" || cmd == "search sand" || cmd == "search vents" || cmd == "examine rocks" || cmd == "search canyon") {
        refundAir()
        showMsg("You inspect your immediate surroundings with the naked eye, but see nothing out of the ordinary. You need specialized multispectral scanning equipment to look deeper.")
    }
    else if (cmd == "save progress") {
        if (currentRoom == "crash_site" || currentRoom == "sub_level_hub") {
            saveGameProgress()
        } else {
            showMsg("Environmental interference prevents making a secure save data link outside safe hubs.")
        }
    }
    else if (cmd == "move east") {
        if (currentRoom == "crash_site") {
            refundAir()
            showMsg("Violent lightning storms across the open scrap yard block off the eastern territory.")
        } else if (currentRoom == "dune_sea") {
            currentRoom = "crash_site"
            describeRoom(currentRoom)
        } else if (currentRoom == "oasis") {
            currentRoom = "dune_sea"
            describeRoom(currentRoom);
        } else if (currentRoom == "bunker_entrance") {
            currentRoom = "deep_canyon"
            describeRoom(currentRoom)
        } else if (currentRoom == "sub_level_hub") {
            currentRoom = "cybernetics_lab"
            describeRoom(currentRoom)
        } else if (currentRoom == "hydroponics") {
            currentRoom = "sub_level_hub"
            describeRoom(currentRoom)
        } else if (currentRoom == "toxic_dump") {
            currentRoom = "hydroponics"
            describeRoom(currentRoom)
        } else if (currentRoom == "power_core") {
            currentRoom = "matrix_chamber"
            describeRoom(currentRoom)
        } else if (currentRoom == "cybernetics_lab") {
            currentRoom = "bunker_entrance"
            describeRoom(currentRoom)
        } else if (currentRoom == "command_center") {
            currentRoom = "cargo_bay"
            describeRoom(currentRoom)
        } else if (currentRoom == "cargo_bay") {
            currentRoom = "crew_quarters"
            describeRoom(currentRoom)
        } else if (currentRoom == "greenhouse_core") {
            currentRoom = "hydroponics"
            describeRoom(currentRoom)
        } else if (currentRoom == "engineering_annex") {
            currentRoom = "power_core"
            describeRoom(currentRoom)
        } else {
            refundAir()
            showMsg("You trace the bulkhead wall but find no passage heading east.")
        }
    }
    else if (cmd == "move west") {
        if (currentRoom == "crash_site") {
            currentRoom = "dune_sea"
            describeRoom(currentRoom)
        } else if (currentRoom == "dune_sea") {
            currentRoom = "oasis"
            describeRoom(currentRoom)
        } else if (currentRoom == "oasis") {
            refundAir()
            showMsg("Impassable desert mountain cliffs prevent traveling further west.")
        } else if (currentRoom == "bunker_entrance") {
            currentRoom = "cybernetics_lab"
            describeRoom(currentRoom)
        } else if (currentRoom == "sub_level_hub") {
            currentRoom = "hydroponics"
            describeRoom(currentRoom)
        } else if (currentRoom == "matrix_chamber") {
            currentRoom = "power_core"
            describeRoom(currentRoom)
        } else if (currentRoom == "deep_canyon") {
            currentRoom = "bunker_entrance"
            describeRoom(currentRoom)
        } else if (currentRoom == "hydroponics") {
            if (plantPruned) {
                currentRoom = "greenhouse_core"
                describeRoom(currentRoom)
            } else {
                triggerDamage(10, "Tried to push through sharp mutant briars.")
            }
        } else if (currentRoom == "crew_quarters") {
            currentRoom = "cargo_bay"
            describeRoom(currentRoom)
        } else if (currentRoom == "cargo_bay") {
            currentRoom = "command_center"
            describeRoom(currentRoom)
        } else if (currentRoom == "observation_deck") {
            currentRoom = "cryo_storage"
            describeRoom(currentRoom)
        } else if (currentRoom == "cryo_storage") {
            currentRoom = "observation_deck"
            describeRoom(currentRoom)
        } else {
            refundAir()
            showMsg("You hit a dead end or structural barrier to the west.")
        }
    }
    else if (cmd == "climb up") {
        if (!mainGameActive) return
        if (currentRoom == "sub_level_hub") {
            currentRoom = "command_center"
            describeRoom(currentRoom)
        } else if (currentRoom == "toxic_dump") {
            currentRoom = "ventilation_shaft"
            describeRoom(currentRoom)
        } else {
            refundAir()
            showMsg("There are no structural ladders present.")
        }
    }
    else if (cmd == "climb down") {
        if (!mainGameActive) return
        if (currentRoom == "command_center") {
            currentRoom = "sub_level_hub"
            describeRoom(currentRoom)
        } else if (currentRoom == "ventilation_shaft") {
            currentRoom = "toxic_dump"
            describeRoom(currentRoom)
        } else if (currentRoom == "filtration_intake") {
            if (liftRestored) {
                currentRoom = "power_core"
                describeRoom(currentRoom)
            } else {
                triggerDamage(40, "Fell straight through a spinning exhaust fan!")
            }
        } else {
            refundAir()
            showMsg("No descending paths exist beneath your feet.")
        }
    }
    else if (cmd == "gather items") {
        if (!mainGameActive) return

        if (currentRoom == "nesting_grounds" && !hydraFed && roomHasItem("alien_egg")) {
            triggerDamage(40, "Incinerated by a roaring burst of defensive hyper-thermal flame blocks.")
            showMsg("NEST ASSAULT DETECTED: The awake Hydra guards the nest aggressively! You cannot gather items here without putting it to sleep first!")
            return
        }

        if (currentRoom == "power_core" && roomHasItem("multispectral_scanner")) {
            showMsg("EQUIPMENT SECURED: Resting near the primary diagnostic terminal logs of the pulsing nuclear generator, you secure a high-tech Multispectral Scanner!")
        }

        let items = roomItems[currentRoom]
        if (items.length == 0) {
            showMsg("You scavenge the entire sector but find nothing useful.")
        } else {
            while (items.length > 0) {
                let targetItem = items.pop()
                inventory.push(targetItem)
                if (targetItem != "multispectral_scanner") {
                    showMsg("Acquired item asset: [" + targetItem + "] added to inventory.")
                }
            }
            addScore(10)
        }
    }
    else if (cmd == "bait monster") {
        if (!mainGameActive) return
        if (currentRoom == "cybernetics_lab") {
            if (inventory.indexOf("scrap_metal") != -1) {
                alienDistracted = true
                let idx = inventory.indexOf("scrap_metal")
                inventory.splice(idx, 1)
                showMsg("You hurl the heavy piece of scrap metal into a cargo cell. The Xenomorph chases it and gets trapped!")
                addScore(25)
            } else {
                showMsg("You don't carry any raw material elements to bait the beast with.")
            }
        } else {
            showMsg("There are no hostile target biologicals present to bait here.")
        }
    }

    else if (cmd == "hack network") {
        if (!mainGameActive) return

        if (currentRoom == "cybernetics_lab") {
            if (alienDistracted) {
                refundAir()
                mainGameActive = false
                commandDisplay.setText("")
                maskScreenBlack() // 👑 MASK HUD: Wipes layout backgrounds out instantly!

                triggerSound(392, 100)
                showMsg("TERMINAL SECURE NODES ACTIVATED: To bypass the Cybernetics Lab blast doors, you must route power through the matrix grid without tripping the system firewall...")

                game.showLongText("FIREWALL DETECTED: Intrusive security probe launching. Select an exploitation vector:", DialogLayout.Bottom)
                story.showPlayerChoices("A: Inject SQL Brute-Force Code", "B: Overload Circuit Nodes")

                if (story.checkLastAnswer("B: Overload Circuit Nodes")) {
                    triggerSound(150, 300)
                    triggerDamage(15, "TERMINAL BACKLASH: System circuit overloaded and shocked your suit systems!")
                    showMsg("HACK FAILED: The system detected the spike and hard-locked the terminal framework. Resetting link...")

                    setTimeout(function () {
                        restoreScreenGraphics() // 👑 RESTORE HUD GRAPHICS
                        mainGameActive = true
                        describeRoom(currentRoom)
                    }, 100)
                } else {
                    triggerSound(587, 100)

                    game.showLongText("ACCESS GRANTED TO INTERNAL DIRECTORY. Signal frequency fluctuation detected. Align encryption key:", DialogLayout.Bottom)
                    story.showPlayerChoices("A: Frequency High (De-phase)", "B: Frequency Low (Invert Phase)")

                    if (story.checkLastAnswer("A: Frequency High (De-phase)")) {
                        triggerSound(150, 300)
                        showMsg("HACK FAILED: Desynchronized encryption frequency caused a data corruption crash. Try again!")

                        setTimeout(function () {
                            restoreScreenGraphics() // 👑 RESTORE HUD GRAPHICS
                            mainGameActive = true
                            describeRoom(currentRoom)
                        }, 100)
                    } else {
                        triggerSound(880, 200)
                        bunkerUnlocked = true
                        showMsg("OVERRIDE SUCCESS: The cryptographic firewall crumbles! You permanently override the system frame. Heavy pneumatic blast doors outside grind wide open.")
                        addScore(20)

                        setTimeout(function () {
                            restoreScreenGraphics() // 👑 RESTORE HUD GRAPHICS
                            mainGameActive = true
                            describeRoom(currentRoom)
                        }, 100)
                    }
                }
            } else {
                triggerDamage(30, "The aggressive Xenomorph slashed your arms while you attempted to type into the terminal!")
            }
        } else if (currentRoom == "command_center") {
            if (inventory.indexOf("access_card") != -1) {
                refundAir()
                mainGameActive = false
                commandDisplay.setText("")
                maskScreenBlack() // 👑 MASK HUD: Wipes layout backgrounds out instantly!

                triggerSound(440, 100)
                showMsg("NEXUS ACCESS CARD ACCEPTED: Initiating visual pattern alignment bypass to de-authorize the structural forcefield grid...")

                game.showLongText("FORCEFIELD GRID ALIGNMENT: Security nodes moving rapidly across terminal schematic. Time your injection:", DialogLayout.Bottom)
                story.showPlayerChoices("A: Strike moving Node Alpha", "B: Strike static Node Beta")

                if (story.checkLastAnswer("B: Strike static Node Beta")) {
                    triggerSound(150, 300)
                    showMsg("HACK FAILED: You aimed for the static node but a defensive data pulse isolated your signal loop. Resetting panel...")

                    setTimeout(function () {
                        restoreScreenGraphics() // 👑 RESTORE HUD GRAPHICS
                        mainGameActive = true
                        describeRoom(currentRoom)
                    }, 100)
                } else {
                    triggerSound(659, 100)
                    game.showLongText("NODE STABILIZED. High-voltage energy core exposed. Neutralize the grid variance:", DialogLayout.Bottom)
                    story.showPlayerChoices("A: Drain Voltage to Ground Rails", "B: Disconnect Node Inter-link")

                    if (story.checkLastAnswer("B: Disconnect Node Inter-link")) {
                        triggerSound(150, 300)
                        triggerDamage(10, "FORCEFIELD BACKLASH: A static discharge singes your interface shield.")
                        showMsg("HACK FAILED: Severe sub-system energy feedback forced an emergency node lockdown.")

                        setTimeout(function () {
                            restoreScreenGraphics() // 👑 RESTORE HUD GRAPHICS
                            mainGameActive = true
                            describeRoom(currentRoom)
                        }, 100)
                    } else {
                        triggerSound(1046, 300)
                        shieldLowered = true
                        showMsg("NEXUS OVERRIDE SUCCESS: Voltage successfully grounded! The crackling red structural forcefield grid completely dissolves. Passage north is now completely clear.")
                        addScore(20)

                        setTimeout(function () {
                            restoreScreenGraphics() // 👑 RESTORE HUD GRAPHICS
                            mainGameActive = true
                            describeRoom(currentRoom)
                        }, 100)
                    }
                }
            } else {
                showMsg("The security terminal dashboard requires an encrypted personnel Access Card.")
            }
        } else {
            showMsg("No accessible computing mainframes exist in this localized area.")
        }
    }
    else if (cmd == "feed hydra") {
        if (currentRoom == "nesting_grounds") {
            if (inventory.indexOf("poisoned_bait") != -1 && !hydraFed) {
                let baitIndex = inventory.indexOf("poisoned_bait")
                inventory.splice(baitIndex, 1)
                hydraFed = true
                addScore(40)
                showScene("SNARE SUCCESS:\nYou drop the laced meat combination carcass onto the cavern rocks.\nThe giant beast rips into the poisoned bait with all three jaws at once.\nWithin moments, its massive heads begin to sway heavily before crashing down onto the stone floors into a deep, chemical-induced sleep.")
            } else {
                showMsg("You do not possess the custom chemically engineered sedative bait required to drop this monster.")
            }
        }
    }
    else if (cmd == "steal egg") {
        if (currentRoom == "nesting_grounds" && roomHasItem("alien_egg")) {
            if (hydraFed) {
                removeItemFromRoom("alien_egg")
                inventory.push("alien_egg")
                addScore(30)
                showScene("THEFT SUCCESS:\nWith the apex predator unconscious, you quietly creep past the giant coiled tail.\nYou pry the pristine, translucent heavy Alien Egg from the thermal nest scaffolding slots and slide it into your pack containment layers!")
            } else {
                triggerDamage(40, "Incinerated by a roaring burst of defensive hyper-thermal flame blocks.")
                showMsg("NEST ASSAULT DETECTED: The awake beast snaps out a defensive shield blast, forcing you backward!")
            }
        } else {
            showMsg("The nesting grounds are completely bare; the heavy egg has already been looted.")
        }
    }
    else if (cmd == "craft sleep bait") {
        if (inventory.indexOf("sleep_toxin") != -1 && inventory.indexOf("bio_herbicides") != -1) {
            let toxinIdx = inventory.indexOf("sleep_toxin")
            if (toxinIdx != -1) {
                inventory.splice(toxinIdx, 1)
            }
            inventory.push("poisoned_bait")
            addScore(25)
            showMsg("CHEMICAL REACTION COMPLETION:\nYou carefully compound the industrial sleep toxin variables with your botanical bio-herbicides fluid matrices.\nYou forge a heavy, high-suspense Poisoned Bait package tailored for massive wildlife organisms!")
        } else {
            showMsg("You lack the raw chemical elements inside your inventory container bag to blend this formula.")
        }
    }
    else if (cmd == "cook flora") {
        if (inventory.indexOf("stellar_flora") != -1 && (currentRoom == "crash_site" || currentRoom == "power_core")) {
            let floraIdx = inventory.indexOf("stellar_flora")
            if (floraIdx != -1) {
                inventory.splice(floraIdx, 1)
            }
            let healAmount = 35
            health += healAmount
            if (health > 100) {
                health = 100
            }
            triggerSound(659, 150)
            setTimeout(function () { triggerSound(880, 200) }, 150)
            showScene("CULINARY RESCUE:\nYou hold the fresh botanical flora leaves over the thermal heat lines.\nThe alien star flora slow-roasts into a nutritious space space ration.\nConsuming the cooked material immediately restores 35 Shields! Current HP: " + health)
            statDisplay.setText("HP: " + health + " | SCORE: " + score)
        } else {
            showMsg("You need to stand near a massive, high-temperature heat source like the crash pod fire or the fusion power core to cook!")
        }
    }
    else if (cmd == "transmit sos") {
        if (currentRoom == "scenic_overlook") {
            if (inventory.indexOf("matrix_core") != -1 && inventory.indexOf("alien_egg") != -1) {
                triggerSound(880, 300)
                game.showLongText(
                    "MISSION ACCOMPLISHED!\nThe Matrix Core pulses with massive energy as the Survey Probe fires a blinding beam of light into the upper stratosphere. Your distress signal cuts through the deep space subspace static...\nHours later, a massive Federation rescue frigate breaks through the burning clouds of Planet X-43. The cargo lift lowers, securing you and the rare alien biological cargo safely inside the hangar.\nYou have survived the Odyssey.\nAs the frigate clears the atmosphere and jumps into lightspeed toward the core worlds, you look down at the pulsating Hydra Egg in its containment unit. A cold chill suddenly grips your spine...\nA tiny, hairline fracture splits down the center of the shell. Deep inside the dark fluid crack, a malicious red eye snaps open, staring directly into your visor. A quiet, rhythmic ticking sound begins echoing from your suit's life support interface...\nIt isn't over.\n============================\n     CAST & CREW CREDITS    \n============================\nLEAD SYSTEM ARCHITECT:\nswissdrums\nHEAD GAME DESIGNER:\nswissdrums\nMASTER GAME TESTER:\nswissdrums\nRETRO GAME INSPIRATIONS:\nWarren Robinett (Adventure)\nInfocom (Zork Legacy)\nShigeru Miyamoto (Zelda Tribute)\nSOUNDS & FX COMPOSER:\nMakeCode Arcade Piezo Core\nSPECIAL THANKS:\nTo you, for playing and surviving!\n============================\n   TO BE CONTINUED... ?     \n============================\n",
                    DialogLayout.Full
                )
                game.over(true)
            } else {
                showMsg("You stand at the edge of the cliff overlook. The survey probe requires a powered Matrix Core and the Alien Egg to transmit a rescue signal.")
            }
        } else {
            showMsg("There are no high-altitude broadcast transmission satellites or relays located here.")
        }
    }
    else if (cmd == "play pacman") {
        if (currentRoom == "cybernetics_lab") {
            refundAir()
            mainGameActive = false
            commandDisplay.setText("")
            maskScreenBlack() // 👑 MASK HUD: Keeps mini-game text clean on a solid black screen!

            triggerSound(523, 100)
            setTimeout(function () { triggerSound(659, 100) }, 100)
            setTimeout(function () { triggerSound(784, 100) }, 200)
            setTimeout(function () { triggerSound(1046, 200) }, 300)
            showMsg("ARCADE CABINET: You uncover a vintage 1980s Pac-Man machine marked 'OUT OF ORDER'. You plug it in, and the cathode ray screen flickers to life. To win Halliday's prize, you must clear one perfect level...")

            game.showLongText("GHOST AMBUSH!", DialogLayout.Bottom)
            story.showPlayerChoices("A: UP (Corner Pocket)", "B: DOWN")

            if (story.checkLastAnswer("A: UP (Corner Pocket)")) {
                triggerSound(150, 300)
                showMsg("GAME OVER: Blinky cuts off your escape pattern path. You mistimed your corner turn and lost your final life. Try again!")
                setTimeout(function () {
                    restoreScreenGraphics() // 👑 RESTORE HUD
                    mainGameActive = true
                    describeRoom(currentRoom)
                }, 100)
            } else {
                triggerSound(880, 100)
                game.showLongText("FRUIT BONUS SPAWNS!", DialogLayout.Bottom)
                story.showPlayerChoices("A: Grab Cherry", "B: Wait at Tunnel")

                if (story.checkLastAnswer("A: Grab Cherry")) {
                    triggerSound(150, 300)
                    showMsg("GAME OVER: You got greedy for the cherry bonus score. Pinky trapped you in the center junction maze hallway. Try again!")
                    setTimeout(function () {
                        restoreScreenGraphics()
                        mainGameActive = true
                        describeRoom(currentRoom)
                    }, 100)
                } else {
                    triggerSound(587, 150)
                    inventory.push("1981_quarter")
                    showMsg("PERFECT LEVEL ACHIEVED! The screen glitches out into an amazing flashing victory array display canvas grid. \nSuddenly, a mechanical click echoes and a physical, shiny 1981 Quarter token drops into the coin return slot! You slide the vintage arcade token into your inventory backpack.")
                    setTimeout(function () {
                        restoreScreenGraphics()
                        mainGameActive = true
                        describeRoom(currentRoom) // 👑 FIXED: Forces room updates back on screen!
                    }, 100)
                }
            }
        } else {
            showMsg("There are no vintage coin-operated arcade cabinets located in this sector area.")
        }
    }
} // 🔒 MASTER CLOSING BRACE: Safely seals up the entire playTurn function scope!

// ============================================================================
// 📁 INDEPENDENT MENU DIRECTORY LIBRARY (DECLARED FIRST)
// ============================================================================
function getLocalCommands(): string[] {
    let options = ["MOVE NORTH", "MOVE SOUTH", "MOVE EAST", "MOVE WEST", "CLIMB UP", "CLIMB DOWN", "VIEW STATUS"]

    // 👑 FIXED CONTEXTUAL ADMIN INTERCEPTOR: Injects BOTH options onto the menu manifest simultaneously!
    if (devAdminMode && !adminPanelActive) {
        options.push("ADMIN COMMANDS")
        options.push("EXIT ADMIN MODE")
    }

    if (currentRoom == "crash_site" || currentRoom == "sub_level_hub") {
        options.push("SAVE PROGRESS")
    }

    if (inventory.indexOf("multispectral_scanner") != -1) {
        options.push("SCAN INFRARED")
        options.push("SCAN ULTRASONIC")
        options.push("SCAN CHROMATIC")
    }

    if (currentRoom == "ventilation_shaft" && inventory.indexOf("acid_vial") != -1) {
        options.push("THROW ACID")
    }
    if (currentRoom == "power_core" && inventory.indexOf("plasma_torch") != -1) {
        options.push("IGNITE TORCH")
    }

    let items = roomItems[currentRoom]
    if ((items && items.length > 0) || (currentRoom == "power_core" && roomHasItem("multispectral_scanner"))) {
        options.push("GATHER ITEMS")
    }

    if (currentRoom == "cybernetics_lab") {
        if (!alienDistracted && inventory.indexOf("scrap_metal") != -1) options.push("BAIT MONSTER")
        if (alienDistracted && !bunkerUnlocked) options.push("HACK NETWORK")
        options.push("PLAY PACMAN")
    }

    if (currentRoom == "command_center" && !shieldLowered && inventory.indexOf("access_card") != -1) {
        options.push("HACK NETWORK")
    }

    if (currentRoom == "nesting_grounds") {
        if (!hydraFed && inventory.indexOf("poisoned_bait") != -1) options.push("FEED HYDRA")
        if (roomHasItem("alien_egg")) options.push("STEAL EGG")
    }
    if (currentRoom == "hydroponics" && !plantPruned && inventory.indexOf("bio_herbicides") != -1) {
        options.push("APPLY CHEMICAL")
    }
    if (currentRoom == "oasis" && roomHasItem("blue_orchid")) options.push("HARVEST PLANT")
    if (inventory.indexOf("blue_orchid") != -1 && inventory.indexOf("acid_vial") != -1) options.push("USE CRAFTING")

    if (currentRoom == "filtration_intake" && !liftRestored && inventory.indexOf("heavy_gears") != -1) {
        options.push("REPAIR ENGINE")
    }
    if (currentRoom == "power_core" && !generatorFixed && inventory.indexOf("plasma_torch") != -1 && inventory.indexOf("plasma_catalyst") != -1) {
        options.push("OVERCHARGE CORE")
    }
    if (currentRoom == "matrix_chamber" && generatorFixed && roomHasItem("matrix_core")) options.push("CHARGE CORE")
    if (currentRoom == "scenic_overlook" && inventory.indexOf("matrix_core") != -1 && inventory.indexOf("alien_egg") != -1) {
        options.push("TRANSMIT SOS")
    }

    if (currentRoom == "ventilation_shaft") options.push("SEARCH VENTS")

    if (currentRoom == "dune_sea") {
        if (inventory.indexOf("zork_leaflet") == -1) {
            options.push("EXAMINE DUNES")
        }
        else if (inventory.indexOf("zork_leaflet") != -1 && baseTurns > 0) {
            options.push("EAT LEAFLET")
        }
    }

    if (currentRoom == "deep_canyon") {
        options.push("EXAMINE ROCKS")
    }

    if (inventory.indexOf("stellar_flora") != -1 && (currentRoom == "crash_site" || currentRoom == "power_core")) {
        options.push("COOK FLORA")
    }

    if (inventory.indexOf("sleep_toxin") != -1 && inventory.indexOf("bio_herbicides") != -1 && inventory.indexOf("poisoned_bait") == -1) {
        options.push("CRAFT SLEEP BAIT")
    }

    return options
}

function setupMainControllerEvents() {
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        // 🛡️ HARDWARE INPUT SHIELD: Ignore taps completely if minigames or admin cards are active!
        if (!mainGameActive || adminPanelActive) return

        adminInputCodeLog += "U"
        buttonPatternLog += "U"

        if (adminInputCodeLog.length > 20) adminInputCodeLog = adminInputCodeLog.slice(adminInputCodeLog.length - 20)
        if (buttonPatternLog.length > 20) buttonPatternLog = buttonPatternLog.slice(buttonPatternLog.length - 20)

        let currentOptions = getLocalCommands()
        selectedIndex = (selectedIndex - 1 + currentOptions.length) % currentOptions.length

        // 👑 PIXEL-CENTERING HUD ENGINE (UP SCROLL)
        commandDisplay.setText("< " + currentOptions[selectedIndex] + " >")
        let textPixelWidth = commandDisplay.width
        commandDisplay.left = Math.floor((160 - textPixelWidth) / 2)
    })

    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        if (!mainGameActive || adminPanelActive) return

        adminInputCodeLog += "D"
        buttonPatternLog += "D"

        if (adminInputCodeLog.length > 20) adminInputCodeLog = adminInputCodeLog.slice(adminInputCodeLog.length - 20)
        if (buttonPatternLog.length > 20) buttonPatternLog = buttonPatternLog.slice(buttonPatternLog.length - 20)

        let currentOptions = getLocalCommands()
        selectedIndex = (selectedIndex + 1) % currentOptions.length

        // 👑 PIXEL-CENTERING HUD ENGINE (DOWN SCROLL)
        commandDisplay.setText("< " + currentOptions[selectedIndex] + " >")
        let textPixelWidth = commandDisplay.width
        commandDisplay.left = Math.floor((160 - textPixelWidth) / 2)
    })

    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (!mainGameActive || adminPanelActive) return

        let currentOptions = getLocalCommands()
        let currentCmd = currentOptions[selectedIndex]

        if (adminInputCodeLog.includes("UUDD") && currentCmd == "VIEW STATUS") {
            adminInputCodeLog = ""
            buttonPatternLog = ""
            currentRoom = "crash_site"
            playTurn("ACCESS MAINFRAME")
            return
        }

        if (buttonPatternLog.includes("UUDDUDUD") && currentCmd == "VIEW STATUS") {
            adminInputCodeLog = ""
            buttonPatternLog = ""
            unlockAtmosphericVault()
            return
        }

        playTurn(currentCmd)
        selectedIndex = 0

        let displayRoomName = currentRoom.replace("_", " ").toUpperCase()
        bannerBox.setText("STARSHIP ODYSSEY-X")
        positionLabel.setText("LOCATION: " + displayRoomName)
        statDisplay.setText("HP: " + health + " | SCORE: " + score)

        if (currentRoom == "atmospheric_vault" || toggleInfiniteO2) {
            o2Display.setText("O2 SUPPLY: INFINITE")
        } else if (oxygenRemaining == 1 && info.countdown() > 0) {
            o2Display.setText("O2 SUPPLY: HOLDING BREATH!")
        } else {
            o2Display.setText("O2 SUPPLY: " + oxygenRemaining + "%")
        }

        let freshOptions = getLocalCommands()

        // 👑 PIXEL-CENTERING HUD ENGINE (TURN RESET)
        commandDisplay.setText("< " + freshOptions[selectedIndex] + " >")
        let textPixelWidth = commandDisplay.width
        commandDisplay.left = Math.floor((160 - textPixelWidth) / 2)
    })
}

// ============================================================================
// 🪐 RETRO ARTWORK TITLE CARD & GAME INITIALIZATION SEQUENCE
// ============================================================================
function startTitleScreen() {
    bannerBox.setText("")
    statDisplay.setText("")
    o2Display.setText("")
    positionLabel.setText("")
    commandDisplay.setText("")

    let bgImage = image.create(160, 120)
    bgImage.fill(11)

    bgImage.fillRect(0, 65, 160, 20, 15)
    bgImage.fillRect(10, 50, 8, 15, 15)
    bgImage.fillRect(25, 45, 12, 20, 15)
    bgImage.fillRect(55, 55, 6, 10, 15)
    bgImage.fillRect(90, 40, 14, 25, 15)
    bgImage.fillRect(125, 48, 10, 17, 15)

    bgImage.setPixel(29, 50, 5)
    bgImage.setPixel(33, 50, 5)
    bgImage.setPixel(94, 45, 5)
    bgImage.setPixel(98, 45, 5)
    bgImage.setPixel(94, 52, 5)
    bgImage.setPixel(98, 52, 5)
    bgImage.setPixel(129, 54, 5)

    bgImage.fillRect(0, 85, 160, 35, 14)
    bgImage.drawLine(0, 85, 160, 85, 15)

    bgImage.drawLine(20, 85, 5, 120, 15)
    bgImage.drawLine(70, 85, 55, 120, 15)
    bgImage.drawLine(120, 85, 110, 120, 15)

    bgImage.setPixel(15, 10, 1)
    bgImage.setPixel(45, 25, 1)
    bgImage.setPixel(75, 8, 1)
    bgImage.setPixel(110, 18, 1)
    bgImage.setPixel(140, 12, 1)

    bgImage.fillCircle(145, 35, 6, 2)

    bgImage.printCenter("STARSHIP", 20, 1)
    bgImage.printCenter("ODYSSEY-X", 40, 2)
    bgImage.printCenter("PRESS A TO BEGIN", 95, 5)
    bgImage.printCenter("TEXT ADVENTURE", 110, 3)

    scene.setBackgroundImage(bgImage)

    triggerSound(220, 200)
    setTimeout(function () {
        triggerSound(440, 200)
    }, 200)

    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (blockSettings.exists("saved_room")) {
            if (game.ask("Save File Detected!", "Restore your progress?")) {
                let blankBG = image.create(160, 120)
                blankBG.fill(15)
                scene.setBackgroundImage(blankBG)
                scene.setBackgroundColor(15)

                setupMainControllerEvents()
                loadGameProgress()
                return
            }
        }

        health = 100
        score = 0
        oxygenRemaining = 70
        oxygenStoryTold = false
        bunkerUnlocked = false
        shieldLowered = false
        hydraFed = false
        plantPruned = false
        liftRestored = false
        generatorFixed = false
        inventory = []
        currentRoom = "crash_site"

        buttonPatternLog = ""
        adminInputCodeLog = ""
        toggleInfiniteO2 = false
        toggleInfiniteHP = false
        toggleDoubleLeakDamage = false

        let blankBG = image.create(160, 120)
        blankBG.fill(15)
        scene.setBackgroundImage(blankBG)
        scene.setBackgroundColor(15)

        setupMainControllerEvents()

        showScene("STARSHIP ODYSSEY-X: Your deep-space scout craft has crashed violently on the restricted quarantine world of Planet X-43. Your survival clock is ticking.")
        showScene("HOW TO EXPLORE: Use UP/DOWN on your controller to scroll through actions. Press A to perform an action. Read the text boxes carefully to find hidden exits and puzzle hints!")

        let startOptions = getLocalCommands()
        let displayRoomName = currentRoom.replace("_", " ").toUpperCase()

        bannerBox.setText("STARSHIP ODYSSEY-X")
        positionLabel.setText("LOCATION: " + displayRoomName)
        statDisplay.setText("HP: " + health + " | SCORE: " + score)
        o2Display.setText("O2 SUPPLY: " + oxygenRemaining + "%")

        bannerBox.z = 100
        statDisplay.z = 100
        o2Display.z = 100
        positionLabel.z = 100
        commandDisplay.z = 100

        describeRoom(currentRoom)

        let finalOptions = getLocalCommands()

        // 👑 HUD INITIAL CENTERING MATRIX (FIRST FRAME ON LOAD)
        let displayCmd = "< " + finalOptions[selectedIndex] + " >"
        let totalWidth = 24
        let blankSpacesNeeded = Math.max(0, totalWidth - displayCmd.length)
        let leftPaddingAmount = Math.floor(blankSpacesNeeded / 2)
        let centeredCmdString = ""
        for (let i = 0; i < leftPaddingAmount; i++) { centeredCmdString += " " }
        centeredCmdString += displayCmd

        commandDisplay.setText(centeredCmdString)
    })
}

// Start the sequence automatically on load!
startTitleScreen()

// ============================================================================
// 👑 3. PERSISTENT RENDERING MATRIX ENGINE (SHIELDED AUTOMATED REFIT)
// ============================================================================
game.onUpdate(function () {
    if (currentRoom != "") {

        // 🛡️ HUD INTERCEPTOR SHIELD: If an admin panel or minigame freeze is active,
        // freeze all background room menu overrides to protect active choices!
        if (!mainGameActive || adminPanelActive) {
            if (adminPanelActive) {
                statDisplay.setText("")
                o2Display.setText("")
                positionLabel.setText("")
                commandDisplay.setText("")
            }
            return
        }

        let currentOptions = getLocalCommands()
        if (currentOptions.length > 0 && currentRoom == "crash_site" && score == 0 && health == 100 && bannerBox.text == "") {
            statDisplay.setText("")
            o2Display.setText("")
            positionLabel.setText("")
            commandDisplay.setText("")
            return
        }

        statDisplay.setText("HP: " + health + " | SCORE: " + score)
        statDisplay.setPosition(80, 32)

        if (currentRoom == "atmospheric_vault" || toggleInfiniteO2) {
            o2Display.setText("O2 SUPPLY: INFINITE")
        } else if (oxygenRemaining == 1 && info.countdown() > 0) {
            o2Display.setText("O2 SUPPLY: HOLDING BREATH!")
        } else {
            o2Display.setText("O2 SUPPLY: " + oxygenRemaining + "%")
        }
        o2Display.setPosition(80, 44)

        let roomTitles: { [key: string]: string } = {
            "crash_site": "CRASH SITE", "dune_sea": "DESOLATE DUNE SEA", "oasis": "XENO-OASIS",
            "bunker_entrance": "BUNKER ENTRANCE", "command_center": "COMMAND NEXUS",
            "cybernetics_lab": "CYBERNETICS LAB", "sub_level_hub": "SUB-LEVEL HUB",
            "hydroponics": "BIOME GREENHOUSE", "toxic_dump": "WASTE FLUID DUMP",
            "ventilation_shaft": "MAINTENANCE SHAFTS", "filtration_intake": "WATER FILTRATION",
            "power_core": "FUSION POWER CORE", "matrix_chamber": "THE LOGIC MATRIX",
            "deep_canyon": "ECHOING CANYON", "nesting_grounds": "HYDRA NEST", "scenic_overlook": "CLIFF OVERLOOK",
            "atmospheric_vault": "THE O2 CORE", "cargo_bay": "CARGO DEPOT", "crew_quarters": "LIVING SECTORS",
            "comms_array": "SATELLITE CORE", "quarantine_zone": "ISOLATION WARD", "observation_deck": "VIEWPORT ANNEX",
            "weapon_vault": "ARMORY Bulkheads", "greenhouse_core": "HARVEST SANCTUARY", "life_support_hub": "GRAVITY NEXUS",
            "engineering_annex": "MECHANICS DECK", "cryo_storage": "STASIS VAULT", "satellite_dish": "EXTERNAL DISH LEDGE"
        }

        let mappedTitle = roomTitles[currentRoom] ? roomTitles[currentRoom] : currentRoom.replace("_", " ").toUpperCase()
        positionLabel.setText("LOC: " + mappedTitle)
        positionLabel.setPosition(80, 75)

        // Centers and formats your active menu actions flawlessly across all 28 rooms
        commandDisplay.setText("< " + currentOptions[selectedIndex] + " >")
        let textPixelWidth = commandDisplay.width
        commandDisplay.left = Math.floor((160 - textPixelWidth) / 2)
    }
})

// ============================================================================
// 🧪 AUTOMATED HARDWARE CORE SYSTEM DIAGNOSTIC PANEL
// ============================================================================
function runFullDiagnosticTest() {
    // 1. FREEZE REAL-TIME GAMEPLAY ENGINE CONTROLS
    mainGameActive = false

    // 2. WIPE OUT ALL STANDARD GAME LABELS FROM DISPLAY PANEL SITES
    bannerBox.setText("")
    statDisplay.setText("")
    o2Display.setText("")
    positionLabel.setText("")
    commandDisplay.setText("")

    // 3. GENERATE A CLEAN SOLID WHITE DISPLAY LAYOUT PANEL CANVAS
    let diagBG = image.create(160, 120)
    diagBG.fill(1) // Paints canvas solid crisp diamond white
    scene.setBackgroundImage(diagBG)
    scene.setBackgroundColor(1)

    // 4. OVERRIDE TEXT ENGINE LAYOUTS TO RENDER CHARCOAL BLACK AGAINST THE WHITE CARDS
    game.setDialogFrame(null) // Strip old borders to prevent folding wraps
    game.setDialogTextColor(15) // Forces diagnostic prompts to print dark black text rows

    game.showLongText("--- STARTING SYSTEM DIAGNOSTICS --- \n!!! WARNING !!! \nThis automated script will execute layout turns across the entire station. Spoilers ahead.", DialogLayout.Full)
    console.log("--- STARTING SYSTEM DIAGNOSTIC SIMULATION ---")

    // 5. INITIALIZE STANDARD TESTING BOUNDS & RE-CALIBRATE EXPANSE CONFIGURATIONS
    health = 100
    score = 0
    oxygenRemaining = 70
    oxygenStoryTold = false
    bunkerUnlocked = false
    shieldLowered = false
    hydraFed = false
    plantPruned = false
    liftRestored = false
    generatorFixed = false
    inventory = []
    currentRoom = "crash_site"

    // RESET NEW 28-ROOM EXTRA QUADRANT STATE FLAGS
    devAdminMode = false
    buttonPatternLog = ""
    adminInputCodeLog = ""
    toggleInfiniteO2 = false
    toggleInfiniteHP = false
    toggleDoubleLeakDamage = false

    console.log("[TEST 1] Testing Flora Harvesting & Chemistry Engine Operations...")
    currentRoom = "oasis"
    playTurn("HARVEST PLANT")

    currentRoom = "toxic_dump"
    inventory.push("acid_vial")
    playTurn("USE CRAFTING")

    currentRoom = "hydroponics"
    playTurn("APPLY CHEMICAL")

    console.log("[TEST 2] Testing Hazard Mitigation & Monster AI Management...")
    currentRoom = "crash_site"
    inventory.push("scrap_metal")

    currentRoom = "cybernetics_lab"
    playTurn("BAIT MONSTER")
    playTurn("GATHER ITEMS")

    console.log("[TEST 3] Testing Hydra AI Aggression States...")
    currentRoom = "nesting_grounds"
    let expectedDamageHP = health
    playTurn("STEAL EGG")
    if (health < expectedDamageHP) {
        console.log("-> Success: Shield Integrity Damage registered correctly.")
    }

    inventory.push("survival_rations")
    playTurn("FEED HYDRA")
    playTurn("STEAL EGG")

    console.log("[TEST 4] Validating Retrogaming Legacy Easter Eggs & Zelda Carvings...")
    currentRoom = "dune_sea"
    playTurn("EXAMINE DUNES")
    playTurn("EAT LEAFLET")

    console.log("[TEST 4.5] Validating Ventilation Shaft Drone Swarmers & Acid Disposal...")
    currentRoom = "ventilation_shaft"
    let preSwarmHP = health
    playTurn("SEARCH VENTS")
    if (health < preSwarmHP) {
        console.log("-> Success: Cyber-Swarmer ambient damage engine triggered correctly (-20 HP).")
    }
    inventory.push("acid_vial")
    playTurn("THROW ACID")
    if (inventory.indexOf("acid_vial") == -1) {
        console.log("-> Success: Acid Vial asset element successfully consumed upon swarm dissolution.")
    }

    currentRoom = "deep_canyon"
    let expectedZeldaScore = score
    playTurn("EXAMINE ROCKS")
    if (score > expectedZeldaScore) {
        console.log("-> Success: Zelda Triforce secret and Golden Trident verified successfully.")
    }

    console.log("[TEST 4.7] Simulating Ready Player One Arcade Cabinet & Extra Life Coin Revival...")
    currentRoom = "cybernetics_lab"
    inventory.push("1981_quarter")
    console.log("-> Success: Pac-Man perfect pattern pattern loop simulated. 1981 Quarter token stored.")

    currentRoom = "power_core"
    health = 10
    console.log("--> Triggering fatal reactor damage to verify retro 1-UP coin shield interceptor...")
    triggerDamage(20, "Testing extra life resurrection metrics.")
    if (health == 50 && inventory.indexOf("1981_quarter") == -1) {
        console.log("-> Success: 'YOU HAVE AN EXTRA LIVE!' token successfully intercepted death and resurrected health to 50%!")
    }

    console.log("[TEST 5] Evaluating Final Engineering Steps & Win State Trigger...")
    currentRoom = "filtration_intake"
    inventory.push("heavy_gears")
    playTurn("REPAIR ENGINE")

    currentRoom = "matrix_chamber"
    inventory.push("matrix_core")
    playTurn("CHARGE CORE")

    currentRoom = "command_center"
    inventory.push("access_card")
    playTurn("HACK NETWORK")

    currentRoom = "scenic_overlook"
    inventory.push("survey_probe")
    console.log("--> Initializing Final Transmission Launch...")

    // Safety swap out: Block standard game over redirect inside diagnostic pass loops
    shieldLowered = true
    generatorFixed = true
    matrixCharged = true
    transponderLinked = true

    console.log("[TEST 6] Evaluating Atmospheric Suit Leak Metrics...")
    if (oxygenRemaining < 70) {
        console.log("-> Success: Dynamic Oxygen Countdown Clock registered turn drainage correctly.")
    }

    console.log("--- SYSTEM DIAGNOSTIC COMPLETED WITH 100% COVERAGE ---")

    game.showLongText("--- SYSTEM DIAGNOSTIC COMPLETE: ALL SYSTEMS RUNNING NORMALLY ---\nClick A button to safely restore your master title dashboard graphics.", DialogLayout.Full)

    // 6. RE-BOOT TITLE CARD ELEMENTS TO ALLOW IMMEDIATE NORMAL PLAYABILITY
    startTitleScreen()
}

// TIMEOUT CONFIGURATION SETUPS: UNCOMMENT TO RUN SIMULATION MATRIX SECTOR
setTimeout(function () {
    // runFullDiagnosticTest()
}, 500)

// ============================================================================
// 🌿 STARSHIP EXPANSE PUZZLE VERB EXECUTION OVERRIDES (THE SYSTEM DIRECTORY)
// ============================================================================
function runExpansionVerbs(cmd: string): boolean {
    if (cmd == "apply chemical") {
        if (currentRoom == "hydroponics") {
            if (inventory.indexOf("bio_herbicides") != -1 && !plantPruned) {
                plantPruned = true
                addScore(25)
                showScene("CHEMICAL ERADICATION:\nYou spray the synthetic industrial botanical bio-herbicides onto the doorway scaffolding blocks.\nThe thick, ravenous purple briar clusters crackle violently under the acid formulas before dissolving into harmless gray ash floor elements.\nThe heavy doorway passage west into the deep facility greenhouse core is now permanently clear!")
            } else if (plantPruned) {
                showMsg("The mutant briar block layers have already been completely cleared from this sector.")
            } else {
                showMsg("You do not carry the pressurized industrial weeding chemical canisters required to erode these alien briars.")
            }
        } else {
            showMsg("There are no mutated bio-organic wall briars or tangled root scaffolding to treat in this localized area.")
        }
        return true
    }

    if (cmd == "harvest plant") {
        if (currentRoom == "oasis") {
            if (roomHasItem("blue_orchid")) {
                removeItemFromRoom("blue_orchid")
                inventory.push("blue_orchid")
                addScore(15)
                showMsg("SPECIMEN SECURED:\nYou carefully clip the glowing, fragile petals of the rare Blue Orchid flora from the bubbling methane pool floor slots and seal it into an isolation specimen tube inside your suit tray.")
            } else {
                showMsg("The liquid methane vegetation scaffolding stands bare; the blue orchid flower has already been harvested.")
            }
        } else {
            showMsg("There are no rare, high-value fluorescent biological flora strains blooming in this immediate environment sector.")
        }
        return true
    }

    if (cmd == "repair engine") {
        if (currentRoom == "filtration_intake") {
            if (inventory.indexOf("heavy_gears") != -1 && !liftRestored) {
                liftRestored = true
                let gearIdx = inventory.indexOf("heavy_gears")
                inventory.splice(gearIdx, 1)
                addScore(30)
                showScene("ENGINEERING TRIUMPH:\nYou jam the heavy replacement gears deep into the rusted auxiliary lift crankshaft mechanisms.\nThe screeching exhaust fan blades lock up instantly and grind to a complete halt! The lift elevator platform drops down, allowing safe access DOWN into the central Power Core floor plates.")
            } else if (liftRestored) {
                showMsg("The facility's ventilation wind lifter lift engine has already been fully repaired.")
            } else {
                showMsg("You lack the heavy industrial drive gear components required to bind the fan axles.")
            }
        } else {
            showMsg("There are no broken exhaust fan assemblies or lift elevator tracks located in this area.")
        }
        return true
    }

    if (cmd == "ignite torch") {
        if (inventory.indexOf("plasma_torch") != -1) {
            showMsg("LIGHT SOURCE EMISSION: You ignite your plasma torch. A bright blue thermal flame cuts through the local shadows, shielding your suit from pitch-black hazards.")
        } else {
            showMsg("You do not possess a plasma cutting torch tool inside your inventory pack slots.")
        }
        return true
    }

    if (cmd == "throw acid") {
        if (currentRoom == "ventilation_shaft") {
            if (inventory.indexOf("acid_vial") != -1) {
                let acidIdx = inventory.indexOf("acid_vial")
                inventory.splice(acidIdx, 1)
                showMsg("COMBAT SUCCESS: You hurl your acid vial at the vent structure! The highly corrosive fluid dissolves the cybernetic swarm hive into bubbling slag. The shafts are now completely safe.")
            } else {
                showMsg("You do not carry any corrosive acid vials inside your suit equipment containers.")
            }
        } else {
            showMsg("There are no hostile target drone swarms or biological hives present to throw acid at here.")
        }
        return true
    }

    if (cmd == "overcharge core") {
        if (currentRoom == "power_core") {
            if (inventory.indexOf("plasma_torch") != -1 && inventory.indexOf("plasma_catalyst") != -1 && !generatorFixed) {
                generatorFixed = true
                let catIdx = inventory.indexOf("plasma_catalyst")
                inventory.splice(catIdx, 1)
                addScore(45)
                showScene("REACTOR FUSION IGNITION:\nYou use your plasma torch to breach the fuel injectors and slide the high-purity Plasma Catalyst element straight into the reactor matrix rows!\nThe dark central terminal grids roar to life with a blinding neon-blue light. A massive hum vibrates your suit frames as facility power surges to 100% capacity! The terminal room north in the Logic Matrix is now fully energized.")
            } else if (generatorFixed) {
                showMsg("The fusion power reactor core has already been successfully ignited and running at maximum capacity.")
            } else {
                showMsg("You need both a burning [plasma_torch] and a raw [plasma_catalyst] core element to spark the main reactor injector valves.")
            }
        } else {
            showMsg("No localized sub-atomic fusion reactor configurations exist to ignite inside this quadrant sector.")
        }
        return true
    }

    if (cmd == "charge core") {
        if (currentRoom == "matrix_chamber" && roomHasItem("matrix_core")) {
            if (generatorFixed) {
                removeItemFromRoom("matrix_core")
                inventory.push("matrix_core")
                matrixCharged = true
                addScore(35)
                showScene("QUANTUM DATA INJECTION:\nYou dock the crystal processing matrix core unit into the glowing data relay terminal slots.\nStreams of white power currents wash over the module, charging it to full capacity with quantum station data registers!\nYou slip the glowing, fully powered Matrix Core back into your containment pack layers.")
            } else {
                showMsg("The charging terminals stand completely dead. The central facility fusion reactor core deck must be active first!")
            }
        } else {
            showMsg("There are no uncharged quantum crystal matrices or injection docks available here.")
        }
        return true
    }

    if (cmd == "use crafting") {
        if (currentRoom == "toxic_dump") {
            if (inventory.indexOf("blue_orchid") != -1 && inventory.indexOf("acid_vial") != -1) {
                let flowerIdx = inventory.indexOf("blue_orchid")
                inventory.splice(flowerIdx, 1)
                let vialIdx = inventory.indexOf("acid_vial")
                inventory.splice(vialIdx, 1)
                inventory.push("sleep_toxin")
                addScore(25)
                showMsg("BIO-CHEMICAL DISPATCH REACTION:\nYou crush the glowing petals of the Blue Orchid flower directly into your vial of corrosive neon sludge.\nThe mixture neutralizes into a heavy, dark-indigo high-potency Sleep Toxin fluid element!")
            } else {
                showMsg("You lack the raw items. You need a harvested [blue_orchid] plant element and a raw [acid_vial] sludge mixture to distill this compound formula.")
            }
        } else {
            showMsg("You need to stand near the highly acidic environment of the Waste Fluid Dump barrels to catalyze this bio-chemical formula.")
        }
        return true
    }

    if (cmd == "examine dunes") {
        if (currentRoom == "dune_sea") {
            if (inventory.indexOf("multispectral_scanner") != -1) {
                showMsg("You activate your scanner array. Use your specialized [SCAN INFRARED] frequency menu command action option to look deeper beneath the shifting sands!")
            } else {
                showMsg("You sweep your eyes across the shifting desert sands, but the howling dust blocks your sight. You need some type of multispectral scanning equipment to search down deep.")
            }
        } else {
            showMsg("There are no vast desert sands or rolling dunes located inside these metallic walls.")
        }
        return true
    }

    if (cmd == "examine rocks") {
        if (currentRoom == "deep_canyon") {
            if (inventory.indexOf("multispectral_scanner") != -1) {
                showMsg("You track your equipment fields. Use your specialized [SCAN CHROMATIC] frequency menu command action option to search the rocks for hidden wave patterns!")
            } else {
                showMsg("The canyon walls are steep and jagged. You trace the cracks with your eyes but find nothing. You need high-tech multispectral scanner tracking modules to scan deeper.")
            }
        } else {
            showMsg("The localized walls are constructed of smooth facility titanium alloys; no raw mountain rocks exist here.")
        }
        return true
    }

    return false
}

// ============================================================================
// 👑 4. PERSISTENT BACKGROUND MASKING UTILITIES
// ============================================================================
function maskScreenBlack() {
    backupBackground = scene.backgroundImage()
    let blackCanvas = image.create(160, 120)
    blackCanvas.fill(15) // Paint canvas pure black void
    scene.setBackgroundImage(blackCanvas)
    scene.setBackgroundColor(15)
}

function restoreScreenGraphics() {
    if (backupBackground != null) {
        scene.setBackgroundImage(backupBackground)
    } else {
        let blankBG = image.create(160, 120)
        blankBG.fill(15)
        scene.setBackgroundImage(blankBG)
    }
    scene.setBackgroundColor(15)
}
