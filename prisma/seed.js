/* eslint-disable no-console */

const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  const seedQuestions = [
    // Task 1 Example
    {
      taskType: "Task 1",
      questionType: "Chart",
      questionText:
        "The chart below shows the percentage of households with access to the internet in three countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      source: "IELTS Liz",
    },
    
    // Discussion Essay Questions
    {
      taskType: "Task 2",
      questionType: "Discussion",
      questionText:
        "Some people think that environmental problems should be solved on a global scale, while others believe it is better to deal with them nationally. Discuss both sides and give your opinion.",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Discussion",
      questionText:
        "All parents want the best opportunities for their children. There are some people who think that schools should teach children skills, but others think having a range of subjects is better for a children's future. Discuss both sides and give your opinion.",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Discussion",
      questionText:
        "There seems to be an increasing number of serious crimes committed each year. While some think the best way is to use the death penalty as a deterrent, many people believe that other measures will be needed. Discuss both sides.",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Discussion",
      questionText:
        "Completing university education is thought by some to be the best way to get a good job. On the other hand, other people think that getting experience and developing soft skills is more important. Discuss both sides and give your opinion.",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Discussion",
      questionText:
        "Some people think that exercise is the key to health, while others feel that having a balanced diet is more important. Discuss both sides and give your opinion.",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Discussion",
      questionText:
        "It is thought by some that it is better to live in a city, while others believe that life is better in the countryside. Discuss both sides and give your opinion.",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Discussion",
      questionText:
        "Some people think that the internet has brought people closer together, while others think that people and communities are becoming more isolated. Discuss both sides and give your opinion.",
      source: "IELTS Liz",
    },
    
    // Opinion Essay Questions
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        '"Prevention is better than cure". Researching and treating diseases is too costly so it would be better to invest in preventative measures. To what extent do you agree?',
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        "With the increased global demand in oil and gas, undiscovered areas of the world should be opened up to access more resources. To what extent do you agree?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        "We live in a world of technology these days. While the internet brings with it clear advantages, the problems in terms of control and security of information outweigh the advantages. To what extent do you agree?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        "In many countries today, parents are able to choose to send their children to single-sex schools or co-educational schools. Some people think that children going to single-sex schools have disadvantages later in life. To what extent do you agree?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        "Scientists and technology experts seem to be more valued by modern society than musicians and artists. To what extent do you agree?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        "Some people think that success is the best measure for intelligence, while others think that intelligence can be measured in other ways. What is your opinion?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        "The growing number of overweight people is putting a strain on the health care system in an effort to deal with the health issues involved. Some people think that the best way to deal with this problem is to introduce more physical education lessons in the school curriculum. To what extent do you agree or disagree?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        "Some people believe that men and women are equal and so women should be able to do any job they want. Others feel that men and women are not equal and therefore there are certain jobs which are not suitable for women. What is your opinion?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Opinion",
      questionText:
        "Some people think that more money should be spent on protecting endangered species while others think it is a waste of valuable money. What is your opinion?",
      source: "IELTS Liz",
    },
    
    // Solution Essay Questions
    {
      taskType: "Task 2",
      questionType: "Solution",
      questionText:
        "In many developing countries, there is a problem with declining quality of air and water from both industry and construction. What measures could be taken to prevent this?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Solution",
      questionText:
        "Many offenders commit more crimes after serving their first punishment. Why is this happening, and what measures can be taken to tackle this problem?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Solution",
      questionText:
        "With the development of social media, more and more youngsters are being allowed unsupervised access to the internet in order to meet and chat with friends which can lead to potentially dangerous situations. What solutions can you suggest to deal with this problem?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Solution",
      questionText:
        "Overpopulation in many major urban centers around the world is a major problem. What are the causes of this? How can this problem be solved?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Solution",
      questionText:
        "More and more wild animals are on the verge of extinction and others are on the endangered list. What are the reasons for this? What can be done to solve this problem?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Solution",
      questionText:
        "Many small, local shops are closing as they are unable to compete with large supermarkets in the area. How does this affect local communities? How could this situation be improved?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Solution",
      questionText:
        "An increasing number of professionals, such as doctors and teachers, are leaving their own poorer countries to work in developed countries. What problems does this cause? What solutions can you suggest to deal with this situation?",
      source: "IELTS Liz",
    },
    
    // Direct Questions
    {
      taskType: "Task 2",
      questionType: "Direct Questions",
      questionText:
        "News plays an important part of most people's lives. Why is news so important to people? Why is so much news dedicated to bad news? Should the news focus on good news instead?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Direct Questions",
      questionText:
        "Most people agree that money cannot buy happiness. Why is happiness difficult to define? How can people achieve happiness?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Direct Questions",
      questionText:
        "Success is often measured by wealth and material belongings. Do you think wealth is the best measure of success? What makes a successful person?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Direct Questions",
      questionText:
        "The internet is a great source of information and has opened up opportunities for people to learn all over the world. Is all information reliable on the internet? What could be done to control information online?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Direct Questions",
      questionText:
        "Art and music are considered some of the fundamental elements of all societies. Do you think art and music still have a place in today's modern world of technology? Should children spend more time learning art and music at school?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Direct Questions",
      questionText:
        'It is often said "When in Rome, do as the Romans do". Do you think people should adapt and accept the culture of the country they are visiting? Do you think it is possible to learn a culture without learning the language?',
      source: "IELTS Liz",
    },
    
    // Advantage/Disadvantage Questions
    {
      taskType: "Task 2",
      questionType: "Advantage/Disadvantage",
      questionText:
        "It is becoming increasingly popular to have a year off between finishing school and going to university. What are the advantages and disadvantages of this?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Advantage/Disadvantage",
      questionText:
        "Some people think that it would be better for large companies and industry to move to regional areas outside large urban centers. Do you think the advantages outweigh the disadvantages?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Advantage/Disadvantage",
      questionText:
        "With the rise of e-books comes the decline in paper books. Some people see this as a good step forward while others do not. What are the advantages and disadvantages of this trend?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Advantage/Disadvantage",
      questionText:
        "The rise of convenience foods has helped people keep up with the speed of modern life. What are the advantages of this trend? Do the advantages outweigh the disadvantages?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Advantage/Disadvantage",
      questionText:
        "There seems to be an increasing trend towards assessing students through exams rather than continual assessment. What are the advantages and disadvantages of exams as a form of assessment?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Advantage/Disadvantage",
      questionText:
        "Space exploration costs taxpayers an exorbitant amount of money each year. What are the advantages and disadvantages of spending money on space exploration?",
      source: "IELTS Liz",
    },
    {
      taskType: "Task 2",
      questionType: "Advantage/Disadvantage",
      questionText:
        "Many elderly people are no longer looked after by their families but are put in care homes or nursing homes. What are the advantages and disadvantages of this trend?",
      source: "IELTS Liz",
    },
  ]

  const existing = await prisma.question.count()
  if (existing > 0) {
    console.log(`Seed skipped: Question already has ${existing} rows.`)
    console.log(`If you want to add new questions, delete the database and run seed again.`)
    return
  }

  await prisma.question.createMany({ data: seedQuestions })
  console.log(`Seeded ${seedQuestions.length} questions successfully.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


