/* eslint-disable no-console */

const { PrismaClient } = require("@prisma/client")
const fs = require("fs")
const path = require("path")

const prisma = new PrismaClient()

async function main() {
  const filePath = path.resolve(__dirname, "../../Part2.md")
  console.log(`Reading file from ${filePath}`)

  if (!fs.existsSync(filePath)) {
    console.error(`File not found at ${filePath}`)
    return
  }

  const fileContent = fs.readFileSync(filePath, "utf-8")
  const lines = fileContent.split("\n").map((l) => l.trim())

  let currentType = "General"
  let buffer = []

  for (const line of lines) {
    if (!line) continue

    // Header detection
    if (line.includes("Discussion Essay Questions")) {
      currentType = "Type A"
      buffer = []
      continue
    }
    if (line.includes("Opinion Essay Questions")) {
      currentType = "Type B"
      buffer = []
      continue
    }
    if (line.includes("Solution Essay Practice Questions")) {
      currentType = "Type E"
      buffer = []
      continue
    }
    if (line.includes("Direct Questions Sample")) {
      currentType = "Direct"
      buffer = []
      continue
    }
    if (line.includes("Advantage / Disadvantage")) {
      currentType = "Type D"
      buffer = []
      continue
    }

    if (line === "IELTS Liz") {
      if (buffer.length > 0) {
        const fullText = buffer.join(" ")

        await prisma.question.create({
          data: {
            taskType: "Task 2",
            questionType: currentType,
            questionText: fullText,
            source: "IELTS Liz",
          },
        })

        console.log(`Created ${currentType} question: ${fullText.substring(0, 30)}...`)
      }
      buffer = []
    } else {
      buffer.push(line)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


