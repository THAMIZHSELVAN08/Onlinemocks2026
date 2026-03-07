import { getSheet } from "./googleSheets";
import prisma from "../src/lib/prisma";
import { writeSheet } from "./googleSheets";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

function normalizeCompany(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/pvt ltd|private limited|ltd/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function main() {
  const resumes = await getSheet(
    "1BGK7a9mgw8y6baJLN9MY_yxZz6yHH4l3uLTofBKgcN4",
    "'Form Responses 1'!A:Z",
  );

  const scoreTabs = [
    "AE",
    "BT",
    "CH",
    "CE",
    "CS",
    "AD",
    "EE",
    "EC",
    "IT",
    "ME",
    "MN",
  ];

  let studentScores: any[] = [];

  for (const tab of scoreTabs) {
    const data = await getSheet(
      "1_rB9B4gYnC68_xlxI6Z7WhSG7f83yXqrnoc_EqZRTbI",
      `'${tab}'!A:Z`,
    );

    studentScores.push(...data);
  }

  const hrSort = await getSheet(
    "1Co6V9a0rLQr4jxDOI-DGinFM2cdhv8Jo4wP943QQckw",
    "'Main List'!A:Z",
  );

  const deptTabs = [
    "AUTO",
    "AIDS",
    "BIO",
    "CHEM",
    "CIVIL",
    "CSE",
    "EEE",
    "ECE",
    "IT",
    "MECH",
    "MAE",
  ];

  let deptAlloc: any[] = [];

  for (const tab of deptTabs) {
    const data = await getSheet(
      "1fP4tZZdSfvreROA4iWVgzVRcxUUHyoIaao-g8TDzO5g",
      `'${tab}'!A:Z`,
    );
    deptAlloc.push(...data);
  }

  const volunteerAlloc = await getSheet(
    "1VonuXL0d7u98zCl7Oy27DHQ-jDTw0N3OCS-ufnuNyTA",
    "'Main Sheet'!A:Z",
  );
  console.log("Resumes:", resumes.length);
  console.log("Student scores:", studentScores.length);
  console.log("HR rows:", hrSort.length);
  console.log("Dept rows:", deptAlloc.length);
  console.log("Volunteer rows:", volunteerAlloc.length);


  const hrMap = new Map<string, string[]>();
  const hrCredentials: string[][] = [];
  for (const row of hrSort) {

    const mode = row["Mode"]?.toLowerCase().trim();

    if (mode !== "online" && mode !== "both") continue;

    const name = row["HR Name"];
    const company = row["Company"];

    if (!name || !company) continue;

    const username = `hr_${company}_${name}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    const password = crypto.randomUUID().slice(0, 8);
    const hash = await bcrypt.hash(password, 10);
    console.log("HR added:", name, company, mode);
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash: hash,
        plainPassword: password,
        role: Role.HR,
        hrProfile: {
          create: {
            name,
            companyName: company,
          },
        },
      },
    });

    hrCredentials.push([name, company, username, password]);

    const key = normalizeCompany(company);
    if (!hrMap.has(key)) hrMap.set(key, []);
    hrMap.get(key)!.push(user.id);
  }

  const studentMap = new Map<string, string>();

  const scoreMap = new Map<string, { aptitude: number; gd: number }>();

  for (const row of studentScores) {
    const reg = String(row["regNo"]).trim();
    if (!reg) continue;

    scoreMap.set(reg, {
      aptitude: Number(row["Apt"] || 0),
      gd: Number(row["GD"] || 0),
    });
  }
  for (const row of resumes) {
    const reg = String(row["Registration Number"]).trim();
    if (!reg) continue;

    const scores = scoreMap.get(reg);

    const student = await prisma.student.upsert({
      where: { registerNumber: reg },
      update: {
        name: row["Name"],
        department: row["Department "]?.trim(),
        aptitudeScore: scores?.aptitude ?? 0,
        gdScore: scores?.gd ?? 0,
        resumeUrl:
          row[
          "Attach a copy of your Resume\n\nResume must be in PDF Format.\nName of the file should be your 13 digit registration number only.\nEg. 2127210101001.pdf"
          ],
      },
      create: {
        name: row["Name"],
        registerNumber: reg,
        department: row["Department "]?.trim(),
        aptitudeScore: scores?.aptitude ?? 0,
        gdScore: scores?.gd ?? 0,
        resumeUrl:
          row[
          "Attach a copy of your Resume\n\nResume must be in PDF Format.\nName of the file should be your 13 digit registration number only.\nEg. 2127210101001.pdf"
          ],
      },
    });

    studentMap.set(reg, student.id);
  }

  const orderMap: Record<string, number> = {};

  for (const row of deptAlloc) {
    const reg = String(row["REGISTRATION NUMBER"]).trim();
    const studentId = studentMap.get(reg);

    if (!studentId) continue;

    const session1 = Object.keys(row).find((k) => k.includes("SESSION 1"));
    const session2 = Object.keys(row).find((k) => k.includes("SESSION 2"));

    const sessions = [
      session1 ? row[session1] : null,
      session2 ? row[session2] : null,
    ];
    for (const session of sessions) {
      if (!session) continue;

      const company = normalizeCompany(session);

      const hrIds = [...hrMap.entries()].find(([k]) =>
        k.includes(company) || company.includes(k)
      )?.[1];

      if (!hrIds) {
        console.log("Company not matched:", company);
        continue;
      }

      if (!orderMap[company]) orderMap[company] = 0;

      const hrId = hrIds[orderMap[company] % hrIds.length];
      orderMap[company]++;

      if (!orderMap[hrId]) orderMap[hrId] = 1;

      await prisma.hrAssignment.upsert({
        where: {
          hrId_order: {
            hrId,
            order: orderMap[hrId],
          },
        },
        update: {},
        create: {
          hrId,
          studentId,
          order: orderMap[hrId],
        },
      });

      orderMap[hrId]++;
    }
  }

  for (const row of volunteerAlloc) {
    const hrName = row["HR NAME "]?.trim();
    const company = row["COMPANY NAME "]?.trim();
    const volunteer = row["VOLUNTEER NAME"]?.trim();

    if (!hrName || !company || !volunteer) continue;

    const key = company
      .replace(/\(.*?\)/g, "")
      .trim()
      .toLowerCase();
    const hrIds = hrMap.get(key);
    const hrId = hrIds?.[0];
    if (!hrId) continue;

    const username = `vol_${volunteer}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    const password = crypto.randomUUID().slice(0, 8);
    const hash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash: hash,
        plainPassword: password,
        role: Role.VOLUNTEER,
        volunteerProfile: {
          create: {
            name: volunteer,
            assignedHrId: hrId,
          },
        },
      },
    });
  }
  hrCredentials.unshift(["HR Name", "Company", "Username", "Password"]);
  await writeSheet(
    "1QDtT5tPAoXv2NvNx-jO8ifpdk1DIsgEUGMG1Zmm9bi8",
    "'HR Credentials'!A1:D",
    hrCredentials,
  );
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
