import { PrismaClient, BackgroundCategory, ToolCategory, Skills, Source } from '../../src/generated/prisma'

export const seedBackground = async (prisma: PrismaClient) => {
    console.log('Seeding backgrounds...')

    // ========== ACOLYTE ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ACOLYTE },
        update: {},
        create: {
            name: BackgroundCategory.ACOLYTE,
            skillProficiencies: [Skills.INSIGHT, Skills.RELIGION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Священний символ', quantity: 1 },
                { name: 'Молитовник або молитовне колесо', quantity: 1 },
                { name: 'Палички ладану', quantity: 5 },
                { name: 'Ритуальний одяг', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 15 }            ]
        }
    })

    // ========== CHARLATAN ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.CHARLATAN },
        update: {},
        create: {
            name: BackgroundCategory.CHARLATAN,
            skillProficiencies: [Skills.DECEPTION, Skills.SLEIGHT_OF_HAND],
            toolProficiencies: [ToolCategory.DISGUISE_KIT, ToolCategory.FORGERY_KIT],
            items: [
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'Набір для маскування', quantity: 1 },
                {
                    name: 'Інструменти шахрая (флакони, підроблені кості, марковані карти, фальшива печатка)',
                    quantity: 1
                },
                { name: 'зм', quantity: 15 }            ]
        }
    })

    // ========== CRIMINAL ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.CRIMINAL },
        update: {},
        create: {
            name: BackgroundCategory.CRIMINAL,
            skillProficiencies: [Skills.DECEPTION, Skills.STEALTH],
            toolProficiencies: [ToolCategory.GAMING_SET, ToolCategory.THIEVES_TOOLS],
            items: [
                { name: 'Ломик', quantity: 1 },
                { name: 'Темний звичайний одяг з капюшоном', quantity: 1 },
                { name: 'зм', quantity: 15 }            ]
        }
    })

    // ========== SPY (Criminal Variant) ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SPY },
        update: {},
        create: {
            name: BackgroundCategory.SPY,
            skillProficiencies: [Skills.DECEPTION, Skills.STEALTH],
            toolProficiencies: [ToolCategory.GAMING_SET, ToolCategory.THIEVES_TOOLS],
            items: [
                { name: 'Ломик', quantity: 1 },
                { name: 'Темний звичайний одяг з капюшоном', quantity: 1 },
                { name: 'зм', quantity: 15 }            ]
        }
    })

    // ========== ENTERTAINER ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ENTERTAINER },
        update: {},
        create: {
            name: BackgroundCategory.ENTERTAINER,
            skillProficiencies: [Skills.ACROBATICS, Skills.PERFORMANCE],
            toolProficiencies: [ToolCategory.DISGUISE_KIT, ToolCategory.MUSICAL_INSTRUMENT],
            items: [
                { name: 'Музичний інструмент (на вибір)', quantity: 1 },
                { name: 'Подарунок від шанувальника (любовний лист, локон волосся або якась дрібничка)', quantity: 1 },
                { name: 'Костюм', quantity: 1 },
                { name: 'зм', quantity: 15 }            ]
        }
    })

    // ========== GLADIATOR (Entertainer Variant) ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GLADIATOR },
        update: {},
        create: {
            name: BackgroundCategory.GLADIATOR,
            skillProficiencies: [Skills.ACROBATICS, Skills.PERFORMANCE],
            toolProficiencies: [ToolCategory.DISGUISE_KIT, ToolCategory.MUSICAL_INSTRUMENT],
            items: [
                { name: 'Музичний інструмент (на вибір)', quantity: 1 },
                { name: 'Подарунок від шанувальника', quantity: 1 },
                { name: 'Незвичайна зброя (тризубець або сітка)', quantity: 1 },
                { name: 'Костюм', quantity: 1 },
                { name: 'зм', quantity: 15 }            ]
        }
    })

    // ========== FOLK_HERO ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.FOLK_HERO },
        update: {},
        create: {
            name: BackgroundCategory.FOLK_HERO,
            skillProficiencies: [Skills.ANIMAL_HANDLING, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS, ToolCategory.VEHICLES_LAND],
            items: [
                { name: 'Ремісничі інструменти (на вибір)', quantity: 1 },
                { name: 'Лопата', quantity: 1 },
                { name: 'Залізний казан', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }            ]
        }
    })

    // ========== GUILD_ARTISAN ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GUILD_ARTISAN },
        update: {},
        create: {
            name: BackgroundCategory.GUILD_ARTISAN,
            skillProficiencies: [Skills.INSIGHT, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            languagesToChooseCount: 1,
            items: [
                { name: 'Ремісничі інструменти (на вибір)', quantity: 1 },
                { name: 'Лист-рекомендація від гільдії', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 15 }            ]
        }
    })

    // ========== GUILD_MERCHANT ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GUILD_MERCHANT },
        update: {},
        create: {
            name: BackgroundCategory.GUILD_MERCHANT,
            skillProficiencies: [Skills.INSIGHT, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.NAVIGATORS_TOOLS],
            languagesToChooseCount: 1,
            items: [
                { name: 'Навігаційні інструменти', quantity: 1 },
                { name: 'Лист-рекомендація від гільдії', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'Мул і віз (опціонально)', quantity: 1 },
                { name: 'зм', quantity: 15 }            ]
        }
    })

    // ========== HERMIT ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.HERMIT },
        update: {},
        create: {
            name: BackgroundCategory.HERMIT,
            skillProficiencies: [Skills.MEDICINE, Skills.RELIGION],
            toolProficiencies: [ToolCategory.HERBALISM_KIT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Футляр для свитків з нотатками', quantity: 1 },
                { name: 'Зимова ковдра', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'Набір травника', quantity: 1 },
                { name: 'зм', quantity: 5 }
            ]
        }
    })

    // ========== NOBLE ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.NOBLE },
        update: {},
        create: {
            name: BackgroundCategory.NOBLE,
            skillProficiencies: [Skills.HISTORY, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.GAMING_SET],
            languagesToChooseCount: 1,
            items: [
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'Перстень-печатка', quantity: 1 },
                { name: 'Свиток з родоводом', quantity: 1 },
                { name: 'зм', quantity: 25 }
            ]
        }
    })

    // ========== KNIGHT (Noble Variant) ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.KNIGHT },
        update: {},
        create: {
            name: BackgroundCategory.KNIGHT,
            skillProficiencies: [Skills.HISTORY, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.GAMING_SET],
            languagesToChooseCount: 1,
            items: [
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'Перстень-печатка', quantity: 1 },
                { name: 'Свиток з родоводом', quantity: 1 },
                { name: 'Банер або герб', quantity: 1 },
                { name: 'зм', quantity: 25 }
            ]
        }
    })

    // ========== OUTLANDER ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.OUTLANDER },
        update: {},
        create: {
            name: BackgroundCategory.OUTLANDER,
            skillProficiencies: [Skills.ATHLETICS, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.MUSICAL_INSTRUMENT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Посох', quantity: 1 },
                { name: 'Мисливська пастка', quantity: 1 },
                { name: 'Трофей від убитої тварини', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }            ]
        }
    })

    // ========== SAGE ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SAGE },
        update: {},
        create: {
            name: BackgroundCategory.SAGE,
            skillProficiencies: [Skills.ARCANA, Skills.HISTORY],
            languagesToChooseCount: 2,
            items: [
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Маленький ніж', quantity: 1 },
                { name: 'Лист від мертвого колеги з питанням, на яке ти ще не відповів', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }            ]
        }
    })

    // ========== SAILOR ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SAILOR },
        update: {},
        create: {
            name: BackgroundCategory.SAILOR,
            skillProficiencies: [Skills.ATHLETICS, Skills.PERCEPTION],
            toolProficiencies: [ToolCategory.NAVIGATORS_TOOLS, ToolCategory.VEHICLES_WATER],
            items: [
                { name: 'Шпилька для канатів (дубинка)', quantity: 1 },
                { name: 'Шовкова мотузка (50 футів)', quantity: 1 },
                { name: 'Талісман на удачу', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }            ]
        }
    })

    // ========== PIRATE (Sailor Variant) ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.PIRATE },
        update: {},
        create: {
            name: BackgroundCategory.PIRATE,
            skillProficiencies: [Skills.ATHLETICS, Skills.PERCEPTION],
            toolProficiencies: [ToolCategory.NAVIGATORS_TOOLS, ToolCategory.VEHICLES_WATER],
            items: [
                { name: 'Шпилька для канатів (дубинка)', quantity: 1 },
                { name: 'Шовкова мотузка (50 футів)', quantity: 1 },
                { name: 'Талісман на удачу', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }            ]
        }
    })

    // ========== SOLDIER ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SOLDIER },
        update: {},
        create: {
            name: BackgroundCategory.SOLDIER,
            skillProficiencies: [Skills.ATHLETICS, Skills.INTIMIDATION],
            toolProficiencies: [ToolCategory.GAMING_SET, ToolCategory.VEHICLES_LAND],
            items: [
                { name: 'Знак рангу', quantity: 1 },
                { name: 'Трофей від переможеного ворога', quantity: 1 },
                { name: 'Набір для гри в кості або гральні карти', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }            ]
        }
    })

    // ========== URCHIN ==========
    await prisma.background.upsert({
        where: { name: BackgroundCategory.URCHIN },
        update: {},
        create: {
            name: BackgroundCategory.URCHIN,
            skillProficiencies: [Skills.SLEIGHT_OF_HAND, Skills.STEALTH],
            toolProficiencies: [ToolCategory.DISGUISE_KIT, ToolCategory.THIEVES_TOOLS],
            items: [
                { name: 'Маленький ніж', quantity: 1 },
                { name: 'Карта міста, де виріс', quantity: 1 },
                { name: 'Домашня миша (буквально)', quantity: 1 },
                { name: 'Значок на пам\'ять від батьків', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }]
        }
    })

    // ==================== XANATHAR'S GUIDE TO EVERYTHING ====================

    // ANTHROPOLOGIST ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ANTHROPOLOGIST },
        update: {},
        create: {
            name: BackgroundCategory.ANTHROPOLOGIST,
            source: Source.XGTE,
            skillProficiencies: [Skills.INSIGHT, Skills.RELIGION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Шкіряний журнал', quantity: 1 },
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'Трінкет з далекої землі', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // ARCHAEOLOGIST ✅ ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ARCHAEOLOGIST },
        update: {},
        create: {
            name: BackgroundCategory.ARCHAEOLOGIST,
            source: Source.XGTE,
            skillProficiencies: [Skills.HISTORY, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.CARTOGRAPHERS_TOOLS, ToolCategory.NAVIGATORS_TOOLS], // ВИПРАВЛЕНО: або Navigator's
            languagesToChooseCount: 1,
            items: [
                { name: 'Дерев\'яний футляр з картою руїн', quantity: 1 },
                { name: 'Ручний ліхтар', quantity: 1 },
                { name: 'Кірка', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'Лопата', quantity: 1 },
                { name: 'Намет на дві особи', quantity: 1 },
                { name: 'Трінкет з розкопок', quantity: 1 },
                { name: 'зм', quantity: 25 }]
        }
    })

    // ==================== SWORD COAST ADVENTURER'S GUIDE ====================

    // CITY_WATCH ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.CITY_WATCH },
        update: {},
        create: {
            name: BackgroundCategory.CITY_WATCH,
            source: Source.SCAG,
            skillProficiencies: [Skills.ATHLETICS, Skills.INSIGHT],
            languagesToChooseCount: 2,
            items: [
                { name: 'Уніформа міської варти', quantity: 1 },
                { name: 'Ріг', quantity: 1 },
                { name: 'Наручники', quantity: 1 },
                { name: 'зм', quantity: 10 }]
        }
    })

    // CLAN_CRAFTER ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.CLAN_CRAFTER },
        update: {},
        create: {
            name: BackgroundCategory.CLAN_CRAFTER,
            source: Source.SCAG,
            skillProficiencies: [Skills.HISTORY, Skills.INSIGHT],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            languagesToChooseCount: 1,
            items: [
                { name: 'Ремісничі інструменти (на вибір)', quantity: 1 },
                { name: 'Наконечник від зламаного кинджала клану', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 5 },
                { name: 'Гема вартістю 10 зм', quantity: 1 }
            ]
        }
    })

    // CLOISTERED_SCHOLAR ✅ ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.CLOISTERED_SCHOLAR },
        update: {},
        create: {
            name: BackgroundCategory.CLOISTERED_SCHOLAR,
            source: Source.SCAG,
            skillProficiencies: [Skills.HISTORY, Skills.RELIGION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Звичайний одяг вченого', quantity: 1 },
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Маленький ніж', quantity: 1 },
                { name: 'Лист від колеги з питанням', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 }, // ДОДАНО
                { name: 'зм', quantity: 10 }]
        }
    })

    // COURTIER ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.COURTIER },
        update: {},
        create: {
            name: BackgroundCategory.COURTIER,
            source: Source.SCAG,
            skillProficiencies: [Skills.INSIGHT, Skills.PERSUASION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 5 }]
        }
    })

    // FACTION_AGENT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.FACTION_AGENT },
        update: {},
        create: {
            name: BackgroundCategory.FACTION_AGENT,
            source: Source.SCAG,
            skillProficiencies: [Skills.INSIGHT, Skills.PERSUASION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Значок або емблема фракції', quantity: 1 },
                { name: 'Копія священного тексту або кодексу', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 15 }]
        }
    })

    // FAR_TRAVELER 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.FAR_TRAVELER },
        update: {},
        create: {
            name: BackgroundCategory.FAR_TRAVELER,
            source: Source.SCAG,
            skillProficiencies: [Skills.INSIGHT, Skills.PERCEPTION],
            toolProficiencies: [ToolCategory.MUSICAL_INSTRUMENT], // ВИПРАВЛЕНО: тільки один!
            languagesToChooseCount: 1,
            items: [
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'Музичний інструмент або ігровий набір', quantity: 1 },
                { name: 'Погано намальована карта рідної землі', quantity: 1 },
                { name: 'Маленький шматок ювелірних виробів (10 зм)', quantity: 1 },
                { name: 'зм', quantity: 5 }]
        }
    })

    // INHERITOR 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.INHERITOR },
        update: {},
        create: {
            name: BackgroundCategory.INHERITOR,
            source: Source.SCAG,
            skillProficiencies: [Skills.SURVIVAL, Skills.RELIGION],
            toolProficiencies: [ToolCategory.GAMING_SET], // ВИПРАВЛЕНО: тільки один!
            languagesToChooseCount: 1,
            items: [
                { name: 'Спадщина (на вибір)', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'Ігровий набір або музичний інструмент', quantity: 1 },
                { name: 'зм', quantity: 15 }]
        }
    })

    // INVESTIGATOR ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.INVESTIGATOR },
        update: {},
        create: {
            name: BackgroundCategory.INVESTIGATOR,
            source: Source.SCAG,
            skillProficiencies: [Skills.INSIGHT, Skills.INVESTIGATION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Уніформа', quantity: 1 },
                { name: 'Ріг', quantity: 1 },
                { name: 'Наручники', quantity: 1 },
                { name: 'зм', quantity: 10 }]
        }
    })

    // KNIGHT_OF_THE_ORDER 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.KNIGHT_OF_THE_ORDER },
        update: {},
        create: {
            name: BackgroundCategory.KNIGHT_OF_THE_ORDER,
            source: Source.SCAG,
            skillProficiencies: [Skills.ATHLETICS, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.GAMING_SET], // ВИПРАВЛЕНО: тільки один!
            languagesToChooseCount: 1,
            items: [
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'Перстень-печатка ордену', quantity: 1 },
                { name: 'Банер або інший символ ордену', quantity: 1 },
                { name: 'зм', quantity: 10 }]
        }
    })

    // MERCENARY_VETERAN ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.MERCENARY_VETERAN },
        update: {},
        create: {
            name: BackgroundCategory.MERCENARY_VETERAN,
            source: Source.SCAG,
            skillProficiencies: [Skills.ATHLETICS, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.GAMING_SET, ToolCategory.VEHICLES_LAND],
            items: [
                { name: 'Уніформа найманця', quantity: 1 },
                { name: 'Інсигнія компанії', quantity: 1 },
                { name: 'Набір для гри в кості або гральні карти', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // URBAN_BOUNTY_HUNTER 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.URBAN_BOUNTY_HUNTER },
        update: {},
        create: {
            name: BackgroundCategory.URBAN_BOUNTY_HUNTER,
            source: Source.SCAG,
            skillProficiencies: [Skills.DECEPTION, Skills.INSIGHT],
            toolProficiencies: [ToolCategory.GAMING_SET, ToolCategory.MUSICAL_INSTRUMENT, ToolCategory.THIEVES_TOOLS], // ВИПРАВЛЕНО: закрито масив, має вибір 2 з цих трьох
            items: [
                { name: 'Відповідний одяг', quantity: 1 },
                { name: 'зм', quantity: 20 }
            ]
        }
    })

    // UTHGARDT_TRIBE_MEMBER 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.UTHGARDT_TRIBE_MEMBER },
        update: {},
        create: {
            name: BackgroundCategory.UTHGARDT_TRIBE_MEMBER,
            source: Source.SCAG,
            skillProficiencies: [Skills.ATHLETICS, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS, ToolCategory.MUSICAL_INSTRUMENT], // ВИПРАВЛЕНО: має вибір одного
            languagesToChooseCount: 1,
            items: [
                { name: 'Мисливська пастка', quantity: 1 },
                { name: 'Тотем або татуювання племені', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // WATERDHAVIAN_NOBLE 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.WATERDHAVIAN_NOBLE },
        update: {},
        create: {
            name: BackgroundCategory.WATERDHAVIAN_NOBLE,
            source: Source.SCAG,
            skillProficiencies: [Skills.HISTORY, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.GAMING_SET, ToolCategory.MUSICAL_INSTRUMENT], // ВИПРАВЛЕНО: має вибір одного
            languagesToChooseCount: 1,
            items: [
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'Перстень-печатка', quantity: 1 },
                { name: 'Свиток з родоводом', quantity: 1 },
                { name: 'зм', quantity: 20 }
            ]
        }
    })

    // ==================== SWORD COAST - ДОДА ТКОВІ ====================

    // FISHER 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.FISHER },
        update: {},
        create: {
            name: BackgroundCategory.FISHER,
            source: Source.SCAG,
            skillProficiencies: [Skills.HISTORY, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.FISHING_TACKLE], // ДОДАНО!
            items: [
                { name: 'Риболовна снасть', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // SHIPWRIGHT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SHIPWRIGHT },
        update: {},
        create: {
            name: BackgroundCategory.SHIPWRIGHT,
            source: Source.SCAG,
            skillProficiencies: [Skills.HISTORY, Skills.PERCEPTION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS, ToolCategory.VEHICLES_WATER],
            items: [
                { name: 'Теслярські інструменти', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // SMUGGLER ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SMUGGLER },
        update: {},
        create: {
            name: BackgroundCategory.SMUGGLER,
            source: Source.SCAG,
            skillProficiencies: [Skills.ATHLETICS, Skills.DECEPTION],
            toolProficiencies: [ToolCategory.VEHICLES_WATER],
            items: [
                { name: 'Дубинка', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 15 }
            ]
        }
    })

    // MARINE ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.MARINE },
        update: {},
        create: {
            name: BackgroundCategory.MARINE,
            source: Source.SCAG,
            skillProficiencies: [Skills.ATHLETICS, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.VEHICLES_LAND, ToolCategory.VEHICLES_WATER],
            items: [
                { name: 'Кинджал', quantity: 1 },
                { name: 'Знак рангу', quantity: 1 },
                { name: 'Набір кісток або гральні карти', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // ==================== RAVNICA BACKGROUNDS ====================

    // AZORIUS_FUNCTIONARY ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.AZORIUS_FUNCTIONARY },
        update: {},
        create: {
            name: BackgroundCategory.AZORIUS_FUNCTIONARY,
            source: Source.GGTR,
            skillProficiencies: [Skills.INSIGHT, Skills.INTIMIDATION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Інсигнія Азоріусу', quantity: 1 },
                { name: 'Сувій з текстом закону', quantity: 1 },
                { name: 'Пляшечка синього чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // BOROS_LEGIONNAIRE ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.BOROS_LEGIONNAIRE },
        update: {},
        create: {
            name: BackgroundCategory.BOROS_LEGIONNAIRE,
            source: Source.GGTR,
            skillProficiencies: [Skills.ATHLETICS, Skills.INTIMIDATION],
            toolProficiencies: [ToolCategory.GAMING_SET, ToolCategory.VEHICLES_LAND],
            languagesToChooseCount: 1,
            items: [
                { name: 'Інсигнія Боросу', quantity: 1 },
                { name: 'Трофей від переможеного ворога', quantity: 1 },
                { name: 'Набір для гри', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // DIMIR_OPERATIVE ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.DIMIR_OPERATIVE },
        update: {},
        create: {
            name: BackgroundCategory.DIMIR_OPERATIVE,
            source: Source.GGTR,
            skillProficiencies: [Skills.DECEPTION, Skills.STEALTH],
            toolProficiencies: [ToolCategory.DISGUISE_KIT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Три комплекти одягу для різних особистостей', quantity: 3 },
                { name: 'Набір для маскування', quantity: 1 },
                { name: 'Інсигнія Діміру', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // GOLGARI_AGENT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GOLGARI_AGENT },
        update: {},
        create: {
            name: BackgroundCategory.GOLGARI_AGENT,
            source: Source.GGTR,
            skillProficiencies: [Skills.NATURE, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.POISONERS_KIT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Інсигнія Голгарі', quantity: 1 },
                { name: 'Набір труїв', quantity: 1 },
                { name: 'Домашній крихітний жучок', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // GRUUL_ANARCH ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GRUUL_ANARCH },
        update: {},
        create: {
            name: BackgroundCategory.GRUUL_ANARCH,
            source: Source.GGTR,
            skillProficiencies: [Skills.ANIMAL_HANDLING, Skills.ATHLETICS],
            toolProficiencies: [ToolCategory.HERBALISM_KIT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Інсигнія Груулу', quantity: 1 },
                { name: 'Набір травника', quantity: 1 },
                { name: 'Мисливська пастка', quantity: 1 },
                { name: 'Трофей від тварини', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // IZZET_ENGINEER ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.IZZET_ENGINEER },
        update: {},
        create: {
            name: BackgroundCategory.IZZET_ENGINEER,
            source: Source.GGTR,
            skillProficiencies: [Skills.ARCANA, Skills.INVESTIGATION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            languagesToChooseCount: 1,
            items: [
                { name: 'Інсигнія Іззету', quantity: 1 },
                { name: 'Один ремісничий інструмент', quantity: 1 },
                { name: 'Обгоріла книга записів', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // ORZHOV_REPRESENTATIVE 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ORZHOV_REPRESENTATIVE },
        update: {},
        create: {
            name: BackgroundCategory.ORZHOV_REPRESENTATIVE,
            source: Source.GGTR,
            skillProficiencies: [Skills.INTIMIDATION, Skills.RELIGION],
            toolProficiencies: [ToolCategory.JEWELERS_TOOLS], // ДОДАНО!
            languagesToChooseCount: 1,
            items: [
                { name: 'Інсигнія Оржова', quantity: 1 },
                { name: 'Ваги ювеліра', quantity: 1 },
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // RAKDOS_CULTIST ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.RAKDOS_CULTIST },
        update: {},
        create: {
            name: BackgroundCategory.RAKDOS_CULTIST,
            source: Source.GGTR,
            skillProficiencies: [Skills.ACROBATICS, Skills.PERFORMANCE],
            toolProficiencies: [ToolCategory.MUSICAL_INSTRUMENT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Інсигнія Ракдоса', quantity: 1 },
                { name: 'Музичний інструмент', quantity: 1 },
                { name: 'Костюм', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // SELESNYA_INITIATE 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SELESNYA_INITIATE },
        update: {},
        create: {
            name: BackgroundCategory.SELESNYA_INITIATE,
            source: Source.GGTR,
            skillProficiencies: [Skills.NATURE, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.HERBALISM_KIT], // ВИПРАВЛЕНО: було ARTISAN_TOOLS
            items: [
                { name: 'Інсигнія Селесніі', quantity: 1 },
                { name: 'Набір травника', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 5 }
            ]
        }
    })

    // SIMIC_SCIENTIST ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SIMIC_SCIENTIST },
        update: {},
        create: {
            name: BackgroundCategory.SIMIC_SCIENTIST,
            source: Source.GGTR,
            skillProficiencies: [Skills.ARCANA, Skills.MEDICINE],
            toolProficiencies: [ToolCategory.HERBALISM_KIT],
            languagesToChooseCount: 2,
            items: [
                { name: 'Інсигнія Сіміку', quantity: 1 },
                { name: 'Набір травника', quantity: 1 },
                { name: 'Книга нотаток', quantity: 1 },
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // ==================== WILDEMOUNT ====================

    // GRINNER 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GRINNER },
        update: {},
        create: {
            name: BackgroundCategory.GRINNER,
            source: Source.EGTW,
            skillProficiencies: [Skills.DECEPTION, Skills.PERFORMANCE],
            toolProficiencies: [ToolCategory.DISGUISE_KIT, ToolCategory.MUSICAL_INSTRUMENT], // ВИПРАВЛЕНО
            items: [
                { name: 'Набір для маскування', quantity: 1 },
                { name: 'Музичний інструмент', quantity: 1 },
                { name: 'Сигнет з емблемою Golden Grin', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 15 }
            ]
        }
    })

    // VOLSTRUCKER_AGENT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.VOLSTRUCKER_AGENT },
        update: {},
        create: {
            name: BackgroundCategory.VOLSTRUCKER_AGENT,
            source: Source.EGTW,
            skillProficiencies: [Skills.DECEPTION, Skills.STEALTH],
            toolProficiencies: [ToolCategory.POISONERS_KIT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'Чорний плащ з капюшоном', quantity: 1 },
                { name: 'Набір для отруєння', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // ==================== THEROS ====================

    // ATHLETE ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ATHLETE },
        update: {},
        create: {
            name: BackgroundCategory.ATHLETE,
            source: Source.MOOT,
            skillProficiencies: [Skills.ACROBATICS, Skills.ATHLETICS],
            toolProficiencies: [ToolCategory.VEHICLES_LAND],
            languagesToChooseCount: 1,
            items: [
                { name: 'Бронзовий диск або шкіряний м’яч', quantity: 1 },
                { name: 'Подарунок від шанувальника', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // ==================== STRIXHAVEN ====================

    // LOREHOLD_STUDENT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.LOREHOLD_STUDENT },
        update: {},
        create: {
            name: BackgroundCategory.LOREHOLD_STUDENT,
            source: Source.SACOC,
            skillProficiencies: [Skills.HISTORY, Skills.RELIGION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            languagesToChooseCount: 1,
            items: [
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Молоток', quantity: 1 },
                { name: 'Книга історії', quantity: 1 },
                { name: 'Шкільна форма', quantity: 1 },
                { name: 'зм', quantity: 15 }
            ]
        }
    })

    // PRISMARI_STUDENT 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.PRISMARI_STUDENT },
        update: {},
        create: {
            name: BackgroundCategory.PRISMARI_STUDENT,
            source: Source.SACOC,
            skillProficiencies: [Skills.ACROBATICS, Skills.PERFORMANCE],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS, ToolCategory.MUSICAL_INSTRUMENT], // ВИПРАВЛЕНО
            languagesToChooseCount: 1,
            items: [
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Один артефакт мистецтва', quantity: 1 },
                { name: 'Шкільна форма', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // QUANDRIX_STUDENT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.QUANDRIX_STUDENT },
        update: {},
        create: {
            name: BackgroundCategory.QUANDRIX_STUDENT,
            source: Source.SACOC,
            skillProficiencies: [Skills.ARCANA, Skills.NATURE],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            languagesToChooseCount: 1,
            items: [
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Рахівниця', quantity: 1 },
                { name: 'Книга аркан теорії', quantity: 1 },
                { name: 'Шкільна форма', quantity: 1 },
                { name: 'зм', quantity: 15 }
            ]
        }
    })

    // SILVERQUILL_STUDENT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SILVERQUILL_STUDENT },
        update: {},
        create: {
            name: BackgroundCategory.SILVERQUILL_STUDENT,
            source: Source.SACOC,
            skillProficiencies: [Skills.INTIMIDATION, Skills.PERSUASION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Книга поезії', quantity: 1 },
                { name: 'Том історії', quantity: 1 },
                { name: 'Шкільна форма', quantity: 1 },
                { name: 'зм', quantity: 15 }
            ]
        }
    })

    // WITHERBLOOM_STUDENT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.WITHERBLOOM_STUDENT },
        update: {},
        create: {
            name: BackgroundCategory.WITHERBLOOM_STUDENT,
            source: Source.SACOC,
            skillProficiencies: [Skills.NATURE, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.HERBALISM_KIT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Набір травника', quantity: 1 },
                { name: 'Залізний казан', quantity: 1 },
                { name: 'Шкільна форма', quantity: 1 },
                { name: 'зм', quantity: 15 }
            ]
        }
    })

    // ==================== OTHER OFFICIAL ====================

    // ASTRAL_DRIFTER ⚠️ (додати source)
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ASTRAL_DRIFTER },
        update: {},
        create: {
            name: BackgroundCategory.ASTRAL_DRIFTER,
            source: Source.SPELLJAMMER, // Потрібно додати правильний source
            skillProficiencies: [Skills.INSIGHT, Skills.RELIGION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Щоденник', quantity: 1 },
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // FACELESS ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.FACELESS },
        update: {},
        create: {
            name: BackgroundCategory.FACELESS,
            source: Source.BGDIA, // Baldur's Gate: Descent into Avernus
            skillProficiencies: [Skills.DECEPTION, Skills.INTIMIDATION],
            toolProficiencies: [ToolCategory.DISGUISE_KIT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Набір для маскування', quantity: 1 },
                { name: 'Костюм або друга персона', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // FAILED_MERCHANT ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.FAILED_MERCHANT },
        update: {},
        create: {
            name: BackgroundCategory.FAILED_MERCHANT,
            source: Source.AI, // Acquisitions Incorporated
            skillProficiencies: [Skills.INVESTIGATION, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            languagesToChooseCount: 1,
            items: [
                { name: 'Ремісничі інструменти', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // FEYLOST ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.FEYLOST },
        update: {},
        create: {
            name: BackgroundCategory.FEYLOST,
            source: Source.WBTW, // Wild Beyond the Witchlight
            skillProficiencies: [Skills.DECEPTION, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.MUSICAL_INSTRUMENT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Музичний інструмент', quantity: 1 },
                { name: 'Три трінкети', quantity: 3 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 8 }
            ]
        }
    })

    // GAMBLER ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GAMBLER },
        update: {},
        create: {
            name: BackgroundCategory.GAMBLER,
            source: Source.AI,
            skillProficiencies: [Skills.DECEPTION, Skills.INSIGHT],
            toolProficiencies: [ToolCategory.GAMING_SET],
            items: [
                { name: 'Набір для азартних ігор', quantity: 1 },
                { name: 'Талісман на удачу', quantity: 1 },
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 15 }
            ]
        }
    })

    // HAUNTED_ONE ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.HAUNTED_ONE },
        update: {},
        create: {
            name: BackgroundCategory.HAUNTED_ONE,
            source: Source.COS, // Curse of Strahd
            skillProficiencies: [Skills.ARCANA, Skills.INVESTIGATION],
            languagesToChooseCount: 2,
            items: [
                { name: 'Сундук', quantity: 1 },
                { name: 'Лом', quantity: 1 },
                { name: 'Молоток', quantity: 1 },
                { name: 'Дерев’яні кілки', quantity: 3 },
                { name: 'Святе символічне зображення', quantity: 1 },
                { name: 'Фляга святої води', quantity: 1 },
                { name: 'Набір кайданів', quantity: 1 },
                { name: 'Сталева дзеркальце', quantity: 1 },
                { name: 'Фляга олії', quantity: 1 },
                { name: 'Набір для розпалювання вогню', quantity: 1 },
                { name: 'Факели', quantity: 3 },
                { name: 'Трінкет особливого значення', quantity: 1 },
                { name: 'Звичайний одяг', quantity: 1 },
                { name: 'sp', quantity: 1 }
            ]
        }
    })

    // PLAINTIFF ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.PLAINTIFF },
        update: {},
        create: {
            name: BackgroundCategory.PLAINTIFF,
            source: Source.AI,
            skillProficiencies: [Skills.MEDICINE, Skills.PERSUASION],
            toolProficiencies: [], // Немає tool proficiencies
            languagesToChooseCount: 1,
            items: [
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 20 }
            ]
        }
    })

    // RIVAL_INTERN ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.RIVAL_INTERN },
        update: {},
        create: {
            name: BackgroundCategory.RIVAL_INTERN,
            source: Source.AI,
            skillProficiencies: [Skills.HISTORY, Skills.INVESTIGATION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            languagesToChooseCount: 1,
            items: [
                { name: 'Набір інструментів', quantity: 1 },
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // WILDSPACER 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.WILDSPACER },
        update: {},
        create: {
            name: BackgroundCategory.WILDSPACER,
            source: Source.SPELLJAMMER, // Spelljammer
            skillProficiencies: [Skills.ATHLETICS, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.NAVIGATORS_TOOLS, ToolCategory.VEHICLES_WATER], // ВИПРАВЛЕНО
            items: [
                { name: 'Шпилька для канатів (дубинка)', quantity: 1 },
                { name: 'Навігаційні інструменти', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // WITCHLIGHT_HAND 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.WITCHLIGHT_HAND },
        update: {},
        create: {
            name: BackgroundCategory.WITCHLIGHT_HAND,
            source: Source.WBTW,
            skillProficiencies: [Skills.PERFORMANCE, Skills.SLEIGHT_OF_HAND],
            toolProficiencies: [ToolCategory.DISGUISE_KIT, ToolCategory.MUSICAL_INSTRUMENT], // ВИПРАВЛЕНО
            languagesToChooseCount: 1,
            items: [
                { name: 'Набір для маскування або музичний інструмент', quantity: 1 },
                { name: 'Фестивальна сувенірна маска', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 8 }
            ]
        }
    })

    // ==================== DRAGONLANCE ====================

    // KNIGHT_OF_SOLAMNIA ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.KNIGHT_OF_SOLAMNIA },
        update: {},
        create: {
            name: BackgroundCategory.KNIGHT_OF_SOLAMNIA,
            source: Source.DRAGONLANCE,
            skillProficiencies: [Skills.ATHLETICS, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.MUSICAL_INSTRUMENT],
            languagesToChooseCount: 1,
            items: [
                { name: 'Інсигнія рангу', quantity: 1 },
                { name: 'Набір дорожнього одягу', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // MAGE_OF_HIGH_SORCERY ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.MAGE_OF_HIGH_SORCERY },
        update: {},
        create: {
            name: BackgroundCategory.MAGE_OF_HIGH_SORCERY,
            source: Source.DRAGONLANCE,
            skillProficiencies: [Skills.ARCANA, Skills.HISTORY],
            languagesToChooseCount: 2,
            items: [
                { name: 'Пляшечка чорнила', quantity: 1 },
                { name: 'Перо', quantity: 1 },
                { name: 'Звичайна роба', quantity: 1 },
                { name: 'зм', quantity: 10 }
            ]
        }
    })

    // ==================== EBERRON ====================

    // HOUSE_AGENT 🔥 ВИПРАВЛЕНО
    await prisma.background.upsert({
        where: { name: BackgroundCategory.HOUSE_AGENT },
        update: {},
        create: {
            name: BackgroundCategory.HOUSE_AGENT,
            source: Source.EBERRON,
            skillProficiencies: [Skills.INVESTIGATION, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            languagesToChooseCount: 1, // ДОДАНО!
            items: [
                { name: 'Набір ремісничих інструментів', quantity: 1 },
                { name: 'Ідентифікаційні папери Дому', quantity: 1 },
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 20 }
            ]
        }
    })

    // ==================== 2024 PHB ====================

    // ARTISAN_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ARTISAN_2024 },
        update: {},
        create: {
            name: BackgroundCategory.ARTISAN_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.INVESTIGATION, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            items: [
                { name: 'Ремісничі інструменти (на вибір)', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 32 }
            ]
        }
    })

    // CHARLATAN_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.CHARLATAN_2024 },
        update: {},
        create: {
            name: BackgroundCategory.CHARLATAN_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.DECEPTION, Skills.SLEIGHT_OF_HAND],
            toolProficiencies: [ToolCategory.FORGERY_KIT],
            items: [
                { name: 'Набір для підробки', quantity: 1 },
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 15 }
            ]
        }
    })

    // CRIMINAL_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.CRIMINAL_2024 },
        update: {},
        create: {
            name: BackgroundCategory.CRIMINAL_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.SLEIGHT_OF_HAND, Skills.STEALTH],
            toolProficiencies: [ToolCategory.THIEVES_TOOLS],
            items: [
                { name: 'Ломик', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 16 }
            ]
        }
    })

    // ENTERTAINER_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.ENTERTAINER_2024 },
        update: {},
        create: {
            name: BackgroundCategory.ENTERTAINER_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.ACROBATICS, Skills.PERFORMANCE],
            toolProficiencies: [ToolCategory.MUSICAL_INSTRUMENT],
            items: [
                { name: 'Музичний інструмент (на вибір)', quantity: 1 },
                { name: 'Костюм', quantity: 2 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 11 }
            ]
        }
    })

    // FARMER_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.FARMER_2024 },
        update: {},
        create: {
            name: BackgroundCategory.FARMER_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.ANIMAL_HANDLING, Skills.NATURE],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            items: [
                { name: 'Серп', quantity: 1 },
                { name: 'Теслярські інструменти', quantity: 1 },
                { name: 'Набір цілителя', quantity: 10 },
                { name: 'Залізний казан', quantity: 1 },
                { name: 'Лопата', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 30 }
            ]
        }
    })

    // GUARD_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GUARD_2024 },
        update: {},
        create: {
            name: BackgroundCategory.GUARD_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.ATHLETICS, Skills.PERCEPTION],
            toolProficiencies: [ToolCategory.GAMING_SET],
            items: [
                { name: 'Спис', quantity: 1 },
                { name: 'Легкий арбалет', quantity: 1 },
                { name: 'Болти', quantity: 20 },
                { name: 'Набір для гри', quantity: 1 },
                { name: 'Ліхтар з капюшоном', quantity: 1 },
                { name: 'Наручники', quantity: 1 },
                { name: 'Сагайдак', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 12 }
            ]
        }
    })

    // GUIDE_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.GUIDE_2024 },
        update: {},
        create: {
            name: BackgroundCategory.GUIDE_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.STEALTH, Skills.SURVIVAL],
            toolProficiencies: [ToolCategory.NAVIGATORS_TOOLS],
            items: [
                { name: 'Короткий лук', quantity: 1 },
                { name: 'Стріли', quantity: 20 },
                { name: 'Картографічні інструменти', quantity: 1 },
                { name: 'Спальний мішок', quantity: 1 },
                { name: 'Сагайдак', quantity: 1 },
                { name: 'Намет', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 3 }
            ]
        }
    })

    // HERMIT_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.HERMIT_2024 },
        update: {},
        create: {
            name: BackgroundCategory.HERMIT_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.MEDICINE, Skills.RELIGION],
            toolProficiencies: [ToolCategory.HERBALISM_KIT],
            items: [
                { name: 'Посох', quantity: 1 },
                { name: 'Набір травника', quantity: 1 },
                { name: 'Спальний мішок', quantity: 1 },
                { name: 'Книга (філософія)', quantity: 1 },
                { name: 'Лампа', quantity: 1 },
                { name: 'Олія', quantity: 3 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 16 }
            ]
        }
    })

    // MERCHANT_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.MERCHANT_2024 },
        update: {},
        create: {
            name: BackgroundCategory.MERCHANT_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.ANIMAL_HANDLING, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.NAVIGATORS_TOOLS],
            items: [
                { name: 'Навігаційні інструменти', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 22 }
            ]
        }
    })

    // NOBLE_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.NOBLE_2024 },
        update: {},
        create: {
            name: BackgroundCategory.NOBLE_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.HISTORY, Skills.PERSUASION],
            toolProficiencies: [ToolCategory.GAMING_SET],
            items: [
                { name: 'Набір для гри', quantity: 1 },
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'Парфуми', quantity: 1 },
                { name: 'зм', quantity: 29 }
            ]
        }
    })

    // SAGE_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SAGE_2024 },
        update: {},
        create: {
            name: BackgroundCategory.SAGE_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.ARCANA, Skills.HISTORY],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            items: [
                { name: 'Каліграфічний набір', quantity: 1 },
                { name: 'Книга (історія)', quantity: 1 },
                { name: 'Пергамент', quantity: 8 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 8 }
            ]
        }
    })

    // SAILOR_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SAILOR_2024 },
        update: {},
        create: {
            name: BackgroundCategory.SAILOR_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.ATHLETICS, Skills.PERCEPTION],
            toolProficiencies: [ToolCategory.NAVIGATORS_TOOLS],
            items: [
                { name: 'Дубинка', quantity: 1 },
                { name: 'Навігаційні інструменти', quantity: 1 },
                { name: 'Конопляна мотузка (50 футів)', quantity: 1 },
                { name: 'Талісман удачі', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 14 }
            ]
        }
    })

    // SCRIBE_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SCRIBE_2024 },
        update: {},
        create: {
            name: BackgroundCategory.SCRIBE_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.INVESTIGATION, Skills.PERCEPTION],
            toolProficiencies: [ToolCategory.ARTISAN_TOOLS],
            items: [
                { name: 'Каліграфічний набір', quantity: 1 },
                { name: 'Гарний одяг', quantity: 1 },
                { name: 'зм', quantity: 23 }
            ]
        }
    })

    // SOLDIER_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.SOLDIER_2024 },
        update: {},
        create: {
            name: BackgroundCategory.SOLDIER_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.ATHLETICS, Skills.INTIMIDATION],
            toolProficiencies: [ToolCategory.GAMING_SET],
            items: [
                { name: 'Спис', quantity: 1 },
                { name: 'Короткий лук', quantity: 1 },
                { name: 'Стріли', quantity: 20 },
                { name: 'Набір для гри', quantity: 1 },
                { name: 'Ліхтар з капюшоном', quantity: 1 },
                { name: 'Сагайдак', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 14 }
            ]
        }
    })

    // WAYFARER_2024 ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.WAYFARER_2024 },
        update: {},
        create: {
            name: BackgroundCategory.WAYFARER_2024,
            source: Source.PHB_2024,
            skillProficiencies: [Skills.INSIGHT, Skills.STEALTH],
            toolProficiencies: [ToolCategory.THIEVES_TOOLS],
            items: [
                { name: 'Інструменти злодія', quantity: 1 },
                { name: 'Карта регіону', quantity: 1 },
                { name: 'Спальний мішок', quantity: 1 },
                { name: 'Дорожній одяг', quantity: 1 },
                { name: 'зм', quantity: 16 }
            ]
        }
    })

    // CUSTOM (може обрати будь-які 2 навички) ✅
    await prisma.background.upsert({
        where: { name: BackgroundCategory.CUSTOM },
        update: {},
        create: {
            name: BackgroundCategory.CUSTOM,
            skillProficiencies: [],
            items: []
        }
    })

    console.log('✅ ALL backgrounds seeded successfully! 🔥🎮💪')
}
