import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";

const teachers = await prisma.teacher.findMany({ select: { email: true, name: true } });
console.log(JSON.stringify(teachers, null, 2));

await prisma.$disconnect();
