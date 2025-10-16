import { PrismaClient} from "../src/generated/prisma";
import { seedWeapons } from "./seed/weaponSeed";
import { seedArmor } from "./seed/armorSeed";
import { seedEquipmentPacks } from "./seed/equipmentPackSeed";
import { seedBackground } from "./seed/backgroundSeed";
const prisma = new PrismaClient()

async function main() {
    console.log('Starting seed...')

    await seedWeapons(prisma)
    await seedArmor(prisma)
    await seedEquipmentPacks(prisma)
    await seedBackground(prisma)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
