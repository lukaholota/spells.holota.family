import { PrismaClient, FeatureDisplayType, RestType, Prisma } from '../../src/generated/prisma'

export const seedFeatures = async (prisma: PrismaClient) => {
    console.log('🌟 Додаємо базові расові фічі...')

    const features: Prisma.FeatureCreateInput[] = [
        // ============ СЕНСИ І ПЕРЦЕПЦІЯ ============
        {
            name: 'Темнозір',
            engName: 'Darkvision',
            description: 'Ви можете бачити в тьмяному світлі на відстані 60 футів так, ніби це яскраве світло, і в темряві так, ніби це тьмяне світло. Ви не можете розрізняти кольори в темряві, лише відтінки сірого.',
            shortDescription: 'Бачення в темряві на 60 футів',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                senses: { darkvision: 60 }
            }
        },
        {
            name: 'Вищий темнозір',
            engName: 'Superior Darkvision',
            description: 'Ви можете бачити в тьмяному світлі на відстані 120 футів так, ніби це яскраве світло, і в темряві так, ніби це тьмяне світло. Ви не можете розрізняти кольори в темряві, лише відтінки сірого.',
            shortDescription: 'Бачення в темряві на 120 футів',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                senses: { darkvision: 120 }
            }
        },
        {
            name: 'Гострі чуття',
            engName: 'Keen Senses',
            description: 'Ви маєте володіння навичкою Уважність.',
            shortDescription: 'Володіння навичкою Уважність',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                skillProficiencies: ['PERCEPTION']
            }
        },

        // ============ ФЕЙ/МАГІЧНА СТІЙКІСТЬ ============
        {
            name: 'Фейське походження',
            engName: 'Fey Ancestry',
            description: 'Ви маєте перевагу при ряткидках проти зачарування, і вас неможливо магічно приспати.',
            shortDescription: 'Перевага на ряткидки проти Зачарування та імунітет до Сну',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                savingThrowAdvantages: {
                    condition: 'CHARMED'
                },
                conditionImmunities: ['MAGICAL_SLEEP']
            }
        },
        {
            name: 'Хитрість гномів',
            engName: 'Gnome Cunning',
            description: 'Ви маєте перевагу на ряткидки Інтелекту, Мудрості та Харизми проти магії.',
            shortDescription: 'Перевага на ментальні ряткидки проти магії',
            displayType: FeatureDisplayType.PASSIVE
        },

        // ============ РАСОВА ВИТРИВАЛІСТЬ ============
        {
            name: 'Дворфська стійкість',
            engName: 'Dwarven Resilience',
            description: 'Ви маєте перевагу на ряткидки проти отрути та опір до отруйної шкоди.',
            shortDescription: 'Перевага проти отрути + опір',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                damageResistances: ['POISON'],
                savingThrowAdvantages: {
                    damageType: 'POISON'
                }
            }
        },
        {
            name: 'Невгамовна витривалість',
            engName: 'Relentless Endurance',
            description: 'Коли ваші хіт-поінти зменшуються до 0, але ви не вмираєте одразу, ви можете впасти до 1 хіт-поінту замість цього. Ви не можете використовувати цю здібність знову, доки не завершите довгий відпочинок.',
            shortDescription: 'Один раз уникнути смерті',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            usesCount: 1
        },
        {
            name: 'Стійкість напівросликів',
            engName: 'Halfling Resilience',
            description: 'Ви маєте перевагу на ряткидки проти страху та отрути.',
            shortDescription: 'Перевага проти страху й отрути',
            displayType: FeatureDisplayType.PASSIVE
        },

        // ============ ЩАСТЯ Й ХОРОБРІСТЬ ============
        {
            name: 'Удача',
            engName: 'Lucky',
            description: 'Коли ви викидаєте 1 на кубику к20 для кидка атаки, перевірки характеристики або ряткидку, ви можете перекинути кубик і повинні використати новий результат.',
            shortDescription: 'Перекинути одиницю на к20',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Хоробрість',
            engName: 'Brave',
            description: 'Ви маєте перевагу на ряткидки проти страху.',
            shortDescription: 'Перевага проти страху',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                savingThrowAdvantages: {
                    condition: 'FRIGHTENED'
                }
            }
        },

        // ============ ПЕКЕЛЬНА/СТИХІЙНА СТІЙКІСТЬ ============
        {
            name: 'Пекельний опір',
            engName: 'Hellish Resistance',
            description: 'Ви маєте опір до вогняної шкоди.',
            shortDescription: 'Опір до вогню',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                damageResistances: ['FIRE']
            }
        },
        {
            name: 'Небесний опір',
            engName: 'Celestial Resistance',
            description: 'Ви маєте опір до променевої шкоди та некротичної шкоди.',
            shortDescription: 'Опір до променевої та некротичної шкоди',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                damageResistances: ['RADIANT', 'NECROTIC']
            }
        },

        // ============ ТРАНС І СОН ============
        {
            name: 'Транс',
            engName: 'Trance',
            description: 'Ельфи не потребують сну. Замість цього вони глибоко медитують, перебуваючи в напівсвідомому стані, протягом 4 годин на день. Під час медитації ви можете бачити сни по-своєму; такі сни насправді є розумовими вправами, які стали рефлективними через роки практики. Після такого відпочинку ви отримуєте ті самі переваги, що й людина після 8 годин сну.',
            shortDescription: '4 години медитації замість 8 годин сну',
            displayType: FeatureDisplayType.PASSIVE
        },

        // ============ ДИХАЛЬНА ЗБРОЯ ============
        {
            name: 'Дихальна зброя (кислота)',
            engName: 'Breath Weapon (Acid)',
            description: 'Ви можете використати свою дію, щоб видихнути руйнівну енергію. Коли ви використовуєте свою дихальну зброю, кожна істота в зоні видиху (5×30 футів (лінія)) має зробити ряткидок Спритності. СК = 8 + ваш модифікатор Статури + ваш бонус Майстерності. Істота отримує 2к6 шкоди Кислотою при провалі і половину цієї шкоди при успіху. Шкода збільшується до 3к6 на 6 рівні, 4к6 на 11 рівні і 5к6 на 16 рівні. Після використання дихальної зброї ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Видих кислотою 5×30 футів (лінія)',
            displayType: FeatureDisplayType.ACTION,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1,
            modifiesStats: {
                breathWeapon: {
                    damageType: 'ACID',
                    shape: 'LINE',
                    aoe: '5×30',
                    savingThrow: 'DEX'
                }
            }
        },
        {
            name: 'Дихальна зброя (блискавка)',
            engName: 'Breath Weapon (Lightning)',
            description: 'Ви можете використати свою дію, щоб видихнути руйнівну енергію. Коли ви використовуєте свою дихальну зброю, кожна істота в зоні видиху (5×30 футів (лінія)) має зробити ряткидок Спритності. СК = 8 + ваш модифікатор Статури + ваш бонус Майстерності. Істота отримує 2к6 шкоди Блискавкою при провалі і половину цієї шкоди при успіху. Шкода збільшується до 3к6 на 6 рівні, 4к6 на 11 рівні і 5к6 на 16 рівні. Після використання дихальної зброї ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Видих блискавкою 5×30 футів (лінія)',
            displayType: FeatureDisplayType.ACTION,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1,
            modifiesStats: {
                breathWeapon: {
                    damageType: 'LIGHTNING',
                    shape: 'LINE',
                    aoe: '5×30',
                    savingThrow: 'DEX'
                }
            }
        },
        {
            name: 'Дихальна зброя (вогонь, конус)',
            engName: 'Breath Weapon (Fire, Cone)',
            description: 'Ви можете використати свою дію, щоб видихнути руйнівну енергію. Коли ви використовуєте свою дихальну зброю, кожна істота в зоні видиху (15 футів (конус)) має зробити ряткидок Спритності. СК = 8 + ваш модифікатор Статури + ваш бонус Майстерності. Істота отримує 2к6 шкоди Вогнем при провалі і половину цієї шкоди при успіху. Шкода збільшується до 3к6 на 6 рівні, 4к6 на 11 рівні і 5к6 на 16 рівні. Після використання дихальної зброї ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Вогняний видих 15 футів (конус)',
            displayType: FeatureDisplayType.ACTION,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1,
            modifiesStats: {
                breathWeapon: {
                    damageType: 'FIRE',
                    shape: 'CONE',
                    aoe: '15',
                    savingThrow: 'DEX'
                }
            }
        },
        {
            name: 'Дихальна зброя (вогонь, лінія)',
            engName: 'Breath Weapon (Fire, Line)',
            description: 'Ви можете використати свою дію, щоб видихнути руйнівну енергію. Коли ви використовуєте свою дихальну зброю, кожна істота в зоні видиху (30 футів (лінія)) має зробити ряткидок Спритності. СК = 8 + ваш модифікатор Статури + ваш бонус Майстерності. Істота отримує 2к6 шкоди Вогнем при провалі і половину цієї шкоди при успіху. Шкода збільшується до 3к6 на 6 рівні, 4к6 на 11 рівні і 5к6 на 16 рівні. Після використання дихальної зброї ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Вогняний видих 30 футів (лінія)',
            displayType: FeatureDisplayType.ACTION,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1,
            modifiesStats: {
                breathWeapon: {
                    damageType: 'FIRE',
                    shape: 'LINE',
                    aoe: '5x30.',
                    savingThrow: 'DEX'
                }
            }
        },
        {
            name: 'Дихальна зброя (отрута)',
            engName: 'Breath Weapon (Poison)',
            description: 'Ви можете використати свою дію, щоб видихнути руйнівну енергію. Коли ви використовуєте свою дихальну зброю, кожна істота в зоні видиху (15 футів (конус)) має зробити ряткидок Статури. СК = 8 + ваш модифікатор Статури + ваш бонус Майстерності. Істота отримує 2к6 шкоди Отрутою при провалі і половину цієї шкоди при успіху. Шкода збільшується до 3к6 на 6 рівні, 4к6 на 11 рівні і 5к6 на 16 рівні. Після використання дихальної зброї ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Отруйний видих 15 футів (конус)',
            displayType: FeatureDisplayType.ACTION,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1,
            modifiesStats: {
                breathWeapon: {
                    damageType: 'POISON',
                    shape: 'CONE',
                    aoe: '15',
                    savingThrow: 'CON'
                }
            }
        },
        {
            name: 'Дихальна зброя (холод)',
            engName: 'Breath Weapon (Cold)',
            description: 'Ви можете використати свою дію, щоб видихнути руйнівну енергію. Коли ви використовуєте свою дихальну зброю, кожна істота в зоні видиху (15 футів (конус)) має зробити ряткидок Статури. СК = 8 + ваш модифікатор Статури + ваш бонус Майстерності. Істота отримує 2к6 шкоди Холодом при провалі і половину цієї шкоди при успіху. Шкода збільшується до 3к6 на 6 рівні, 4к6 на 11 рівні і 5к6 на 16 рівні. Після використання дихальної зброї ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Холодний видих 15 футів (конус)',
            displayType: FeatureDisplayType.ACTION,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1,
            modifiesStats: {
                breathWeapon: {
                    damageType: 'COLD',
                    shape: 'CONE',
                    aoe: '15',
                    savingThrow: 'CON'
                }
            }
        },

        // ============ ПРИРОДНИЙ ОБЛАДУНОК ============
        {
            name: 'Природна броня',
            engName: 'Natural Armor',
            description: 'Ваша шкура має грубу, лускоподібну текстуру. Коли ви не носите обладунки, ваш Клас Броні дорівнює 13 + ваш модифікатор Спритності. Ви можете використовувати свою природну броню для визначення вашого КБ, якщо обладунок, який ви носите, залишить вас з нижчим КБ. Переваги щита застосовуються як звичайно.',
            shortDescription: 'КБ = 13 + Спритність',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                naturalArmor: {
                    baseAC: 13,
                    addsDex: true
                }
            }
        },
        {
            name: 'Лускате тіло',
            engName: 'Scaled Body',
            description: 'Ваша шкура вкрита дрібною лускою. Коли ви не носите обладунки, ваш КБ дорівнює 13 + ваш модифікатор Спритності. Ви можете використовувати щит і все одно отримувати цю перевагу.',
            shortDescription: 'КБ = 13 + Спритність',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                naturalArmor: {
                    baseAC: 13,
                    addsDex: true
                }
            }
        },

        // ============ РОЗМІРИ І ШВИДКІСТЬ ============
        {
            name: 'Малюк',
            engName: 'Nimble',
            description: 'Ви малого розміру. Ваша швидкість не зменшується від носіння важкого обладунку.',
            shortDescription: 'Малий розмір',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Швидкість напівросликів',
            engName: 'Halfling Nimbleness',
            description: 'Ваша швидкість не зменшується від носіння важкого обладунку.',
            shortDescription: 'Без сповільнення від важких обладунків',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Спритність',
            engName: 'Nimbleness',
            description: 'Ви можете рухатися крізь простір будь-якої істоти, розмір якої більший за ваш.',
            shortDescription: 'Рух через простір великих істот',
            displayType: FeatureDisplayType.PASSIVE
        },

        // ============ ВРОДЖЕННА МАГІЯ (ТИФЛІНГИ) ============
        {
            name: 'Інфернальна спадщина',
            engName: 'Infernal Legacy',
            description: 'Ви знаєте заклинання Дивотворство [Thaumaturgy]. Коли ви досягаєте 3-го рівня, ви можете один раз використати заклинання Пекельна відсіч [Hellish Rebuke] як заклинання 2-го рівня. Коли ви досягаєте 5-го рівня, ви також можете один раз використати заклинання Темрява [Darkness]. Після використання Пекельної відсічі [Hellish Rebuke] або Темряви [Darkness] ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. ІХаризма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю.',
            shortDescription: 'Дивотворство [Thaumaturgy], Пекельна відсіч [Hellish Rebuke], Темрява [Darkness]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Thaumaturgy' },
                    { engName: 'Hellish Rebuke' },
                    { engName: 'Darkness' }
                ]
            }
        },

        // ============ ВРОДЖЕНІ ЗДІБНОСТІ ============
        {
            name: 'Кам\'яна витривалість',
            engName: 'Dwarven Toughness',
            description: 'Ваш максимум хіт-поінтів збільшується на 1, і він збільшується на 1 кожного разу, коли ви отримуєте рівень.',
            shortDescription: '+1 HP на рівень',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                hpPerLevel: 1
            }
        },
        {
            name: 'Каменярство',
            engName: 'Stonecunning',
            description: 'Ви маєте експертизу на перевірки Історії, що стосуються походження кам\'яних споруд',
            shortDescription: 'експертиза на історію в питаннях походження робіт із каменю',
            displayType: FeatureDisplayType.PASSIVE,
        },
        {
            name: 'Дворфська витонченість',
            engName: 'Dwarven Armor Training',
            description: 'Ви маєте володіння легким і середнім обладунком.',
            shortDescription: 'Володіння легким та середнім обладунком',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                armorProficiencies: ['LIGHT', 'MEDIUM']
            }
        },
        {
            name: 'Ельфійська зброя',
            engName: 'Elf Weapon Training',
            description: 'Ви володієте довгим мечем, коротким мечем, коротким луком і довгим луком.',
            shortDescription: 'Володіння ельфійською зброєю',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                weaponProficiencies: ['LONGSWORD', 'SHORTSWORD', 'SHORTBOW', 'LONGBOW']
            }
        },
        {
            name: 'Майстерність загрози',
            engName: 'Menacing',
            description: 'Ви володієте навичкою Залякування.',
            shortDescription: 'Володіння Залякуванням',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                skillProficiencies: ['INTIMIDATION']
            }
        },
        {
            name: 'Дикий інстинкт',
            engName: 'Natural Instinct',
            description: 'Ви володієте навичками Виживання та Поводження з тваринами.',
            shortDescription: 'Володіння Виживанням та Поводженням з тваринами',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: {
                skillProficiencies: ['SURVIVAL', 'ANIMAL_HANDLING']
            }
        },

        // ============ РАСОВІ БОНУСИ 2024 ============
        {
            name: 'Винахідливість',
            engName: 'Ingenious',
            description: 'Якщо ви провалюєте перевірку здібності використовуючи інструмент, ви можете додати бонус +к4. Ви можете використовувати цю здібність кількість разів, що дорівнює вашому бонусу володіння, і відновлюєте всі витрачені використання після завершення довгого відпочинку.',
            shortDescription: '+к4 до перевірок інструментів після провалу',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST
        },
        {
            name: 'Астральне знання',
            engName: 'Astral Knowledge',
            description: 'Ви можете божественно відчути грані долі всередині себе. Коли ви закінчуєте довгий відпочинок, ви отримуєте володіння одною навичкою на ваш вибір і одним інструментом або музичним інструментом на ваш вибір, обраним з Книги гравця. Ви містично отримуєте ці володіння, черпаючи їх із спільного свідомості ґітьянків, і ви зберігаєте їх, доки не закінчите свій наступний довгий відпочинок.',
            shortDescription: 'Щоденна навичка/інструмент на вибір',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            usesCount: 1
        },
        {
            name: 'Дикі атаки',
            engName: 'Savage Attacks',
            description: 'Коли ви завдаєте критичного удару ближньобійною зброєю, ви можете ще раз кинути один із кубиків шкоди цієї зброї та додати результат до додаткової шкоди критичного удару.',
            shortDescription: 'додатковий кубик на кріт',
            displayType: FeatureDisplayType.PASSIVE
        },

        // ############################################## MPMM

        {
            name: 'Політ',
            engName: 'Flight',
            description: 'Завдяки вашим крилам, ви маєте швидкість польоту, що дорівнює вашій швидкості ходьби. Ви не можете використовувати цю швидкість польоту, якщо носите середній або важкий обладунок.',
            shortDescription: 'Швидкість польоту = швидкості ходьби, не робе з середнім чи важким обладунком',
            displayType: FeatureDisplayType.PASSIVE,
        },

        // ============ AASIMAR ============
        {
            name: 'Цілющі руки',
            engName: 'Healing Hands',
            description: 'Дією ви можете торкнутися істоти й відновити їй кількість здоров\'я, що дорівнює вашому Бонусу Майстерності. Після використання цієї здібності ви не можете використовувати її знову, доки не завершите довгий відпочинок.',
            shortDescription: 'Зцілення = Бонус Майстерності',
            displayType: FeatureDisplayType.ACTION,
            limitedUsesPer: RestType.LONG_REST,
            usesCount: 1
        },
        {
            name: 'Світлоносець',
            engName: 'Light Bearer',
            description: 'Ви знаєте замовляння Світло [Light].',
            shortDescription: 'замовляння Світло [Light]',
            displayType: FeatureDisplayType.PASSIVE,
            givesSpells: {
                connect: [{ engName: 'Light' }]
            }
        },

// ============ AASIMAR PROTECTOR ============
        {
            name: 'Небесне одкровення',
            engName: 'Celestial Revelation',
            description: 'Бонусною дією ви можете магічно проявити спектральні крила з вашої спини. Ви отримуєте швидкість польоту 30 футів на 1 хвилину. Після використання цієї здібності ви не можете використовувати її знову, доки не завершите довгий відпочинок.',
            shortDescription: 'політ 30 футів на 1 хвилину',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            usesCount: 1
        },

// ============ BUGBEAR ============
        {
            name: 'Несподівана атака',
            engName: 'Surprise Attack',
            description: 'Якщо ви вражаєте істоту атакою в перший раунд бою, ця атака завдає додаткові 2к6 шкоди цілі. Ви можете використовувати цю здібність лише один раз за бій.',
            shortDescription: '+2к6 шкоди в першому раунді',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Довгі кінцівки',
            engName: 'Long-Limbed',
            description: 'Коли ви здійснюєте рукопашну атаку під час свого ходу, ваша дальність для неї збільшується на 5 футів.',
            shortDescription: '+5 футів дальності рукопашних атак',
            displayType: FeatureDisplayType.PASSIVE
        },

// ============ CENTAUR ============
        {
            name: 'Штурм',
            engName: 'Charge',
            description: 'Якщо ви рухаєтесь принаймні на 30 футів прямо до цілі, а потім вражаєте її рукопашною атакою зброєю в той самий хід, ви можете негайно здійснити один додатковий удар копитами Бонусною дією.',
            shortDescription: 'Бонусна атака після руху на 30 футів',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Копита',
            engName: 'Hooves',
            description: 'Ви маєте копита, які можете використовувати для атак без зброї. Якщо ви вражаєте ними, ви завдаєте дробильну шкоду 1к6 + ваш модифікатор Сили.',
            shortDescription: 'Атака без зброї 1к6 + СИЛ',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Кінська статура',
            engName: 'Equine Build',
            description: 'Ви вважаєтесь на один розмір більшими, коли розраховується ваша вантажопідйомність або вага, яку ви можете штовхати чи тягнути.\n' +
                '\n' +
                'Крім того, лазіння, яке потребує рук і ніг, є для вас особливо важким через вашу кінську будову. Під час такого лазіння кожен фут руху коштує вам 4 додаткові фути замість звичайного 1.',
            shortDescription: 'лазіння 1 фут = 4; на один розмір більший',
            displayType: FeatureDisplayType.PASSIVE
        },

// ============ CHANGELING ============
        {
            name: 'Перевертень',
            engName: 'Shapechanger',
            description: 'Дією ви можете змінити свій зовнішній вигляд та свій голос. Ви вирішуєте, як виглядаєте, включаючи висоту, вагу, риси обличчя, звучання вашого голосу, колір волосся, колір шкіри та інші відмітні характеристики. Ви можете здаватися іншої раси, але жодна з ваших ігрових характеристик не змінюється.',
            shortDescription: 'Зміна зовнішності Дією',
            displayType: FeatureDisplayType.ACTION
        },

// ============ DEEP GNOME ============
        {
            name: 'Кам\'яне маскування',
            engName: 'Stone Camouflage',
            description: 'Ви маєте перевагу на перевірки Спритності (Непомітність), щоб сховатися в кам\'яному середовищі.',
            shortDescription: 'Перевага на Непомітність у каменях',
            displayType: FeatureDisplayType.PASSIVE
        },

// ============ DUERGAR ============
        {
            name: 'Стійкість дуергарів',
            engName: 'Duergar Resilience',
            description: 'Ви маєте перевагу на ряткидки проти ілюзій та проти зачарування або паралічу.',
            shortDescription: 'Перевага проти ілюзій, зачарування, паралічу',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Магія дуергарів',
            engName: 'Duergar Magic',
            description: 'Коли ви досягаєте 3-го рівня, ви можете один раз використати заклинання Збільшення/Зменшення [Enlarge/Reduce] на себе. Коли ви досягаєте 5-го рівня, ви також можете один раз використати заклинання Невидимість [Invisibility] на себе. Після використання кожного з цих заклять ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси).',
            shortDescription: 'Збільшення/Зменшення [Enlarge/Reduce], Невидимість [Invisibility]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Enlarge/Reduce' },
                    { engName: 'Invisibility' }
                ]
            }
        },

// ============ ELADRIN ============
        {
            name: 'Фейський крок',
            engName: 'Fey Step',
            description: 'Бонусною дією ви можете магічно телепортуватися на відстань до 30 футів у вільний простір, який ви бачите. Ви можете використовувати цю здібність кількість разів, що дорівнює вашому Бонусу Майстерності, і відновлюєте всі витрачені використання після завершення довгого відпочинку.',
            shortDescription: 'Телепорт 30 футів Бонусною дією',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST
        },

// ============ FAIRY ============
        {
            name: 'Фейська магія',
            engName: 'Fairy Magic',
            description: 'Ви знаєте замовляння Ремесло друїдів [Druidcraft]. Коли ви досягаєте 3-го рівня, ви можете один раз використати заклинання Вогники фей [Faerie Fire]. Коли ви досягаєте 5-го рівня, ви також можете один раз використати заклинання Збільшення/Зменшення [Enlarge/Reduce]. Після використання Вогників фей [Faerie Fire] або Збільшення/Зменшення [Enlarge/Reduce] ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси).',
            shortDescription: 'Ремесло друїдів [Druidcraft], Вогники фей [Faerie Fire], Збільшення/Зменшення [Enlarge/Reduce]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Druidcraft' },
                    { engName: 'Faerie fire' },
                    { engName: 'Enlarge/Reduce' }
                ]
            }
        },

// ============ FIRBOLG ============
        {
            name: 'Прихований крок',
            engName: 'Hidden Step',
            description: 'Бонусною дією ви можете магічно стати невидимим до початку вашого наступного ходу або до моменту, коли ви атакуєте, завдаєте шкоди або змушуєте когось зробити ряткидок. Після використання цієї здібності ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Тимчасова невидимість',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1
        },
        {
            name: 'Могутня статура',
            engName: 'Powerful Build',
            description: 'Ви вважаєтесь на один розмір більшим при визначенні вашої вантажопідйомності та ваги, яку ви можете штовхати, тягнути або піднімати.',
            shortDescription: 'Подвійна вантажопідйомність',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Магія фірболгів',
            engName: 'Firbolg Magic',
            description: 'Ви можете один раз використати заклинання Виявлення магії [Detect Magic] та Маскування [Disguise Self]. Коли ви використовуєте цю версію Маскування [Disguise Self], ви можете здаватися на 3 фути вищим або нижчим. Після використання кожного з цих заклять ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси).',
            shortDescription: 'Виявлення магії [Detect Magic], Маскування [Disguise Self]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Detect Magic' },
                    { engName: 'Disguise Self' }
                ]
            }
        },

// ============ GENASI AIR ============
        {
            name: 'Злиття з вітром',
            engName: 'Mingle with the Wind',
            description: 'Ви знаєте замовляння Шокувальний дотик [Shocking Grasp]. Коли ви досягаєте 3-го рівня, ви можете один раз використати заклинання Падіння пір\'їною [Feather Fall]. Коли ви досягаєте 5-го рівня, ви також можете один раз використати заклинання Левітація [Levitate] на себе. Після використання Падіння пір\'їною [Feather Fall] або Левітації [Levitate] ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси).',
            shortDescription: 'Шокувальний дотик [Shocking Grasp], Падіння пір\'їною [Feather Fall], Левітація [Levitate]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Shocking Grasp' },
                    { engName: 'Feather Fall' },
                    { engName: 'Levitate' }
                ]
            }
        },

// ============ GENASI EARTH ============
        {
            name: 'Злиття з каменем',
            engName: 'Merge with Stone',
            description: 'Ви знаєте замовляння Захист від зброї [Blade Ward]. Ви можете використовувати його основною дією, але також - бонусною кількість разів, що дорівнюють вашому Бонусу Майстерності, і ви відновлюєте кількість таких використань після довгого відпочинку. Коли ви досягаєте 5-го рівня, ви можете один раз використати заклинання Переміщення без сліду [Pass without Trace]. Після використання Переміщення без сліду [Pass without Trace] ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси).',
            shortDescription: 'Захист від зброї [Blade Ward], Переміщення без сліду [Pass without Trace]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Blade Ward' },
                    { engName: 'Pass without Trace' }
                ]
            }
        },

// ============ GENASI FIRE ============
        {
            name: 'Досягти полум\'я',
            engName: 'Reach to the Blaze',
            description: 'Ви знаєте замовляння Створення вогню [Produce Flame]. Коли ви досягаєте 3-го рівня, ви можете один раз використати заклинання Палючі долоні [Burning Hands] як заклинання 1-го рівня. Коли ви досягаєте 5-го рівня, ви також можете один раз використати заклинання Палаюча сфера [Flaming Sphere] як заклинання 2-го рівня. Після використання Палючих долонь [Burning Hands] або Палаючої сфери [Flaming Sphere] ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси).',
            shortDescription: 'Створення вогню [Produce Flame], Палючі долоні [Burning Hands], Палаюча сфера [Flaming Sphere]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Produce Flame' },
                    { engName: 'Burning Hands' },
                    { engName: 'Flaming Sphere' }
                ]
            }
        },

// ============ GENASI WATER ============
        {
            name: 'Поклик хвилі',
            engName: 'Call to the Wave',
            description: 'Ви знаєте замовляння Формування води [Shape Water]. Коли ви досягаєте 3-го рівня, ви можете один раз використати заклинання Створення чи знищення води [Create or Destroy Water] як заклинання 1-го рівня. Коли ви досягаєте 5-го рівня, ви також можете один раз використати заклинання Дихання водою [Water Breathing]. Після використання Створення чи знищення води [Create or Destroy Water] або Дихання водою [Water Breathing] ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси).',
            shortDescription: 'Формування води [Shape Water], Створення чи знищення води [Create or Destroy Water], Дихання водою [Water Breathing]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Shape Water' },
                    { engName: 'Create or Destroy Water' },
                    { engName: 'Water Breathing' }
                ]
            }
        },

// ============ GITHYANKI ============
        {
            name: 'Псіоніка ґітьянків',
            engName: 'Githyanki Psionics',
            description: 'Ви знаєте замовляння Магічна рука [Mage Hand], і рука невидима, коли ви використовуєте це замовляння з цією здібністю. Коли ви досягаєте 3-го рівня, ви можете використати заклинання Стрибок [Jump] з цією здібністю. Коли ви досягаєте 5-го рівня, ви також можете використати заклинання Туманний крок [Misty Step] з нею. Після того, як ви використали Стрибок [Jump] або Туманний крок [Misty Step] з цією здібністю, ви не можете використати це заклинання з нею знову, доки не завершите довгий відпочинок. Ви також можете використати будь-яке з цих заклинань, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси). Жодне з цих заклинань не вимагає компонентів заклинання, коли ви використовуєте їх з цією здібністю.',
            shortDescription: 'Магічна рука [Mage Hand], Стрибок [Jump], Туманний крок [Misty Step]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Mage Hand' },
                    { engName: 'Jump' },
                    { engName: 'Misty Step' }
                ]
            }
        },

// ============ GITHZERAI ============
        {
            name: 'Ментальна дисципліна',
            engName: 'Mental Discipline',
            description: 'Ваші вроджені псіонічні здібності дають вам перевагу на ряткидки проти станів Зачарування та Переляку та ваші думки не можуть бути прочитані за допомогою телепатії, якщо ви не дозволите це.',
            shortDescription: 'Перевага проти зачарування, захист думок',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Псіоніка ґітцераїв',
            engName: 'Githzerai Psionics',
            description: 'Ви знаєте замовляння Магічна рука [Mage Hand], і рука невидима, коли ви використовуєте це замовляння з цією здібністю. Коли ви досягаєте 3-го рівня, ви можете один раз використати заклинання Щит [Shield]. Коли ви досягаєте 5-го рівня, ви також можете один раз використати заклинання Виявлення думок [Detect Thoughts]. Після використання Щита [Shield] або Виявлення думок [Detect Thoughts] ви не можете використовувати це заклинання знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси). Жодне з цих заклинань не вимагає компонентів заклинання, коли ви використовуєте їх з цією здібністю.',
            shortDescription: 'Магічна рука [Mage Hand], Щит [Shield], Виявлення думок [Detect Thoughts]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Mage Hand' },
                    { engName: 'Shield' },
                    { engName: 'Detect Thoughts' }
                ]
            }
        },

// ============ GOBLIN ============
        {
            name: 'Лють маленького',
            engName: 'Fury of the Small',
            description: 'Коли ви завдаєте шкоди істоті атакою або заклинанням, і розмір цієї істоти більший за ваш, ви можете завдати додаткову шкоду цілі, що дорівнює вашому Бонусу Майстерності. Після використання цієї здібності ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Додаткова шкода = Бонусу Майстерності',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1
        },
        {
            name: 'Спритна втеча',
            engName: 'Nimble Escape',
            description: 'Ви можете виконати дію Вивільнення або Сховатися Бонусною дією в кожен зі своїх ходів.',
            shortDescription: 'Вивільнення/Сховатися Бонусною дією',
            displayType: FeatureDisplayType.PASSIVE
        },

// ============ GOLIATH ============
        {
            name: 'Витривалість каменю',
            engName: 'Stone\'s Endurance',
            description: 'Реакцією, коли ви отримуєте шкоду, ви можете зменшити цю шкоду на 1к12 + ваш модифікатор Статури. Після використання цієї здібності ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Зменшення шкоди на 1к12 + КОН',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1
        },

// ============ HARENGON ============
        {
            name: 'Зайчачий рефлекс',
            engName: 'Hare-Trigger',
            description: 'Ви можете додати свій Бонус Майстерності до своїх кидків ініціативи.',
            shortDescription: '+Бонус Майстерності до ініціативи',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Заячі чуття',
            engName: 'Leporine Senses',
            description: 'Ви маєте володіння навичкою Сприйняття.',
            shortDescription: 'Володіння Сприйняттям',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: { skillProficiencies: ['PERCEPTION'] }
        },
        {
            name: 'Заячий стрибок',
            engName: 'Lucky Footwork',
            description: 'Коли ви провалюєте перевірку Спритності або ряткидок, ви можете використати свою реакцію, щоб перекинути к20. Ви повинні використати новий результат. Після використання цієї здібності ви не можете використовувати її знову, доки не завершите довгий відпочинок.',
            shortDescription: 'Перекинути провальну перевірку Спритності',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            usesCount: 1
        },

// ============ HOBGOBLIN ============
        {
            name: 'Удача від багатьох',
            engName: 'Fortune from the Many',
            description: 'Якщо ви промахуєтесь атакою або провалюєте перевірку здібності чи ряткидок, ви можете додати бонус до кидка, що дорівнює кількості союзників, яких ви можете бачити в межах 30 футів від вас (максимум бонус +3). Після використання цієї здібності ви не можете використовувати її знову, доки не завершите довгий відпочинок.',
            shortDescription: '+1-3 до провалу від союзників',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            usesCount: 1
        },

// ============ KENKU ============
        {
            name: 'Пам\'ять кенку',
            engName: 'Kenku Recall',
            description: 'Завдяки вашій чудовій пам\'яті, ви маєте володіння двома навичками на ваш вибір. Крім того, коли ви робите перевірку здібності, використовуючи будь-яку навичку, якою ви володієте, ви можете надати собі перевагу на перевірку перед киданням к20. Ви можете зробити це кількість разів, що дорівнює вашому Бонусу Майстерності, і відновлюєте всі витрачені використання після завершення довгого відпочинку.',
            shortDescription: '2 навички + перевага на володіння',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST
        },

// ============ KOBOLD ============
        {
            name: 'Драконячий крик',
            engName: 'Draconic Cry',
            description: 'Бонусною дією ви видаєте крик на позначення битви, який надає вам і вашим союзникам в межах 10 футів перевагу на кидках атаки до початку вашого наступного ходу. Після використання цієї здібності ви не можете використовувати її знову, доки не завершите довгий відпочинок.',
            shortDescription: 'Перевага на атаки для союзників',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            usesCount: 1
        },

// ============ LIZARDFOLK ============
        {
            name: 'Голодні щелепи',
            engName: 'Hungry Jaws',
            description: 'Ви можете кинутися зубами на істоту. Ваш укус завдає 1к6 + ваш модифікатор Сили ріжучої шкоди. Після укусу ви отримуєте тимчасові хіт-поінти, що дорівнюють вашому Бонусу Майстерності. Ви можете використовувати цю здібність кількість разів, що дорівнює вашому Бонусу Майстерності, і відновлюєте всі витрачені використання після завершення довгого відпочинку.',
            shortDescription: 'Укус 1к6 + СИЛ, тимчасові HP',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST
        },
        {
            name: 'Затримка дихання',
            engName: 'Hold Breath',
            description: 'Ви можете затримати подих на 15 хвилин.',
            shortDescription: 'Затримка дихання 15 хвилин',
            displayType: FeatureDisplayType.PASSIVE
        },

// ============ MINOTAUR ============
        {
            name: 'Роги',
            engName: 'Horns',
            description: 'Ви маєте роги, які можете використовувати для атак без зброї. Якщо ви вражаєте ними, ви завдаєте колючу шкоду 1к6 + ваш модифікатор Сили.',
            shortDescription: 'Атака рогами 1к6 + СИЛ',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Таранний рух',
            engName: 'Goring Rush',
            description: 'Якщо ви рухаєтесь принаймні на 20 футів прямо до цілі, а потім вражаєте її рогами в той самий хід, ціль отримує додаткові 1к6 колючої шкоди.',
            shortDescription: '+1к6 після руху на 20 футів',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Таранний удар',
            engName: 'Hammering Horns',
            description: 'Коли ви використовуєте дію Атака під час свого ходу, щоб зробити рукопашну атаку, ви можете спробувати штовхнути ціль вашими рогами. Ціль не повинна бути більш ніж на один розмір більшою за вас. Якщо ви вражаєте ціль, вона повинна зробити ряткидок Сили проти СК = 8 + ваш Бонус Майстерності + ваш модифікатор Сили. При провалі ви штовхаєте ціль на 10 футів від себе.',
            shortDescription: 'Штовхання після атаки',
            displayType: FeatureDisplayType.PASSIVE
        },

// ============ ORC ============
        {
            name: 'Прилив адреналіну',
            engName: 'Adrenaline Rush',
            description: 'Ви можете виконати дію Ривок Бонусною дією. Коли ви це робите, ви отримуєте кількість тимчасових хіт-поінтів, що дорівнює вашому Бонусу Майстерності. Ви можете використовувати цю здібність кількість разів, що дорівнює вашому Бонусу Майстерності, і відновлюєте всі витрачені використання після завершення довгого відпочинку.',
            shortDescription: 'Ривок + тимчасові HP',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST
        },

// ============ SATYR ============
        {
            name: 'Опір магії',
            engName: 'Magic Resistance',
            description: 'Ви маєте перевагу на ряткидки проти заклять.',
            shortDescription: 'Перевага на ряткидки проти заклять',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Веселі стрибки',
            engName: 'Mirthful Leaps',
            description: 'Коли ви робите стрибок у довжину або висоту, ви можете кинути к8 і додати число до кількості футів, які ви покриваєте.',
            shortDescription: '+к8 футів до стрибків',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Гуляка',
            engName: 'Reveler',
            description: 'Ви маєте володіння навичкою Виконання та одним музичним інструментом на ваш вибір.',
            shortDescription: 'Володіння Виконанням + інструмент',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: { skillProficiencies: ['PERFORMANCE'] }
        },

// ============ SEA ELF ============
        {
            name: 'Тренування морських ельфів',
            engName: 'Sea Elf Training',
            description: 'Ви володієте списом, тризубом, легким арбалетом та сіткою.',
            shortDescription: 'Володіння зброєю морських ельфів',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: { weaponProficiencies: ['SPEAR', 'TRIDENT', 'LIGHT_CROSSBOW', 'NET'] }
        },
        {
            name: 'Дитя моря',
            engName: 'Child of the Sea',
            description: 'Ви маєте швидкість плавання 30 футів, і ви можете дихати повітрям та під водою.',
            shortDescription: 'Плавання 30 футів + дихання під водою',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: { swimSpeed: 30 }
        },

// ============ SHADAR-KAI ============
        {
            name: 'Благословення воронячої королеви',
            engName: 'Blessing of the Raven Queen',
            description: 'Бонусною дією ви можете магічно телепортуватися на відстань до 30 футів у вільний простір, який ви бачите. Після телепортації ви маєте опір до всіх видів шкоди до початку вашого наступного ходу. Ви можете використовувати цю здібність кількість разів, що дорівнює вашому Бонусу Майстерності, і відновлюєте всі витрачені використання після завершення довгого відпочинку.',
            shortDescription: 'Телепорт 30 футів + опір шкоді',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST
        },
        {
            name: 'Некротичний опір',
            engName: 'Necrotic Resistance',
            description: 'Ви маєте опір до некротичної шкоди.',
            shortDescription: 'Опір до некротичної шкоди',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: { damageResistances: ['NECROTIC'] }
        },

// ============ SHIFTER ============
        {
            name: 'Перетворення',
            engName: 'Shifting',
            description: 'Бонусною дією ви можете прийняти більш звіряче вигляд. Ця трансформація триває 1 хвилину, до вашої смерті або до того, як ви вимкнете її Бонусною дією. Коли ви перетворюєтесь, ви отримуєте тимчасові хіт-поінти, що дорівнюють вашому рівню + ваш модифікатор Статури (мінімум 1). Ви також отримуєте додаткові переваги, які залежать від вашої підраси шифтера. Після використання цієї здібності ви не можете використовувати її знову, доки не завершите короткий або довгий відпочинок.',
            shortDescription: 'Звіряча форма на 1 хвилину',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.SHORT_REST,
            usesCount: 1
        },

// ============ TABAXI ============
        {
            name: 'Котячі кігті',
            engName: 'Cat\'s Claws',
            description: 'Ви маєте кігті, які можете використовувати для атак без зброї. Якщо ви вражаєте ними, ви завдаєте ріжучу шкоду 1к6 + ваш модифікатор Сили замість дробильної шкоди, нормальної для атаки без зброї.',
            shortDescription: 'Кігті 1к6 + СИЛ',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Котячий талант',
            engName: 'Cat\'s Talent',
            description: 'Ви маєте володіння навичками Сприйняття та Непомітність.',
            shortDescription: 'Володіння Сприйняттям та Непомітністю',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: { skillProficiencies: ['PERCEPTION', 'STEALTH'] }
        },
        {
            name: 'Котяча спритність',
            engName: 'Feline Agility',
            description: 'Коли ви рухаєтесь у свій хід у бою, ви можете подвоїти свою швидкість до кінця ходу. Після використання цієї здібності ви не можете використовувати її знову, доки не рухаєтесь 0 футів в один зі своїх ходів.',
            shortDescription: 'Подвоєння швидкості 1 раз',
            displayType: FeatureDisplayType.RESOURCE
        },

// ============ TORTLE ============
        {
            name: 'Захист панцира',
            engName: 'Shell Defense',
            description: 'Ви можете втягнутися у свій панцир Дією. До того, як ви вийдете, ви отримуєте +4 бонус до КБ, і ви маєте перевагу на ряткидки Сили та Статури. Перебуваючи у своєму панцирі, ви вважаєтесь лежачим, ваша швидкість 0 і не може збільшуватися, ви маєте перешкоду на ряткидки Спритності, ви не можете виконувати реакції, і єдина дія, яку ви можете виконати, це Бонусна дія, щоб вийти з панцира.',
            shortDescription: '+4 КБ у панцирі',
            displayType: FeatureDisplayType.ACTION
        },

// ============ TRITON ============
        {
            name: 'Контроль повітря та води',
            engName: 'Control Air and Water',
            description: 'Ви можете один раз використати заклинання Туманна хмара [Fog Cloud]. Коли ви досягаєте 3-го рівня, ви можете один раз використати замовляння Порив вітру [Gust of Wind]. Коли ви досягаєте 5-го рівня, ви також можете один раз використати заклинання Ходіння по воді [Water Walk]. Після використання цих заклять ви не можете використовувати їх знову, доки не завершите довгий відпочинок. Ви також можете використовувати ці заклинання, використовуючи будь-які слоти заклинань відповідного рівня, які у вас є. Інтелект, Мудрість або Харизма є вашою характеристикою для цих заклинань, коли ви використовуєте їх з цією здібністю (ви обираєте при виборі цієї раси).',
            shortDescription: 'Туманна хмара [Fog Cloud], Порив вітру [Gust of Wind], Ходіння по воді [Water Walk]',
            displayType: FeatureDisplayType.RESOURCE,
            limitedUsesPer: RestType.LONG_REST,
            givesSpells: {
                connect: [
                    { engName: 'Fog Cloud' },
                    { engName: 'Gust of Wind' },
                    { engName: 'Water Walk' }
                ]
            }
        },
        {
            name: 'Посланець моря',
            engName: 'Emissary of the Sea',
            description: 'Ви можете спілкуватися простими ідеями з звірами, які можуть дихати під водою. Вони можуть розуміти значення ваших слів, хоча ви не маєте спеціальної здатності розуміти їх у відповідь.',
            shortDescription: 'Спілкування з морськими тваринами',
            displayType: FeatureDisplayType.PASSIVE
        },
        {
            name: 'Вартові глибин',
            engName: 'Guardians of the Depths',
            description: 'Ви маєте опір до холодної шкоди та ігноруєте будь-які недоліки від глибокої, темної води.',
            shortDescription: 'Опір до холоду + адаптація до глибин',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: { damageResistances: ['COLD'] }
        },

// ============ YUAN-TI ============
        {
            name: 'Імунітет до отрути',
            engName: 'Poison Immunity',
            description: 'Ви маєте імунітет до отруйної шкоди та стану отруєння.',
            shortDescription: 'Імунітет до отрути',
            displayType: FeatureDisplayType.PASSIVE,
            modifiesStats: { damageImmunities: ['POISON'], conditionImmunities: ['POISONED'] }
        }
    ]

    for (const feature of features) {
        await prisma.feature.upsert({
            where: { name: feature.name },
            update: feature,
            create: feature
        })
    }

    console.log(`✅ Додано ${ features.length } расових фіч!`)
}
