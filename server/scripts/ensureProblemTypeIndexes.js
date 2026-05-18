const mongoose = require("mongoose");
const ProblemType = require("../models/ProblemType");

require("dotenv").config();

const COMPOUND_INDEX_KEY = { hotelId: 1, name: 1 };
const MASTER_NAME_INDEX_KEY = { name: 1 };
const MASTER_NAME_INDEX_NAME = "name_1";

function keysEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function findDuplicateProblemTypes() {
  return ProblemType.aggregate([
    {
      $group: {
        _id: "$name",
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);
}

function printDuplicateReport(duplicates) {
  console.error("Duplicate problem type names found across the master list.");
  console.error("Resolve these records before changing the index:");

  duplicates.forEach((duplicate) => {
    const name = duplicate._id || "missing name";
    const ids = duplicate.ids.map((id) => String(id)).join(", ");

    console.error(`- name="${name}" count=${duplicate.count} ids=${ids}`);
  });
}

async function ensureProblemTypeIndexes() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const duplicates = await findDuplicateProblemTypes();
  if (duplicates.length) {
    printDuplicateReport(duplicates);
    process.exitCode = 1;
    return;
  }

  await ProblemType.collection.createIndex(MASTER_NAME_INDEX_KEY, {
    unique: true,
    name: MASTER_NAME_INDEX_NAME,
  });
  console.log(`Ensured unique master index: ${MASTER_NAME_INDEX_NAME}`);

  const indexes = await ProblemType.collection.indexes();
  const compoundIndexes = indexes.filter(
    (index) => index.unique && keysEqual(index.key, COMPOUND_INDEX_KEY)
  );

  for (const index of compoundIndexes) {
    await ProblemType.collection.dropIndex(index.name);
    console.log(`Dropped legacy compound index: ${index.name}`);
  }

  if (!compoundIndexes.length) {
    console.log("No legacy unique compound index found");
  }

  const finalIndexes = await ProblemType.collection.indexes();
  console.log("Current problemtypes indexes:");
  finalIndexes.forEach((index) => {
    console.log(`- ${index.name}: ${JSON.stringify(index.key)} unique=${Boolean(index.unique)}`);
  });
}

ensureProblemTypeIndexes()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
