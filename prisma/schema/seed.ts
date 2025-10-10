import { PrismaClient} from "../src/generated/prisma";
import { seedWeapons } from "./seed/weaponSeed";
import { seedArmor } from "./seed/armorSeed";
const prisma = new PrismaClient()

async function main() {
    console.log('Starting seed...')

    await seedWeapons(prisma)
    await seedArmor(prisma)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
