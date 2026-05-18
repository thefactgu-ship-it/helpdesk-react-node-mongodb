const mongoose = require("mongoose");
const ProblemType = require("../models/ProblemType");

require("dotenv").config();

const LEGACY_NAME_INDEX_KEY = { name: 1 };
const COMPOUND_INDEX_KEY = { hotelId: 1, name: 1 };
const COMPOUND_INDEX_NAME = "hotelId_1_name_1";

function keysEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function findDuplicateProblemTypes() {
  return ProblemType.aggregate([
    {
      $group: {
        _id: {
          hotelId: "$hotelId",
          name: "$name",
        },
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
        "_id.hotelId": 1,
        "_id.name": 1,
      },
    },
  ]);
}

function printDuplicateReport(duplicates) {
  console.error("Duplicate problem types found within the same hotel.");
  console.error("Resolve these records before changing indexes:");

  duplicates.forEach((duplicate) => {
    const hotelId = duplicate._id.hotelId || "missing hotelId";
    const name = duplicate._id.name || "missing name";
    const ids = duplicate.ids.map((id) => String(id)).join(", ");

    console.error(`- hotelId=${hotelId} name="${name}" count=${duplicate.count} ids=${ids}`);
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

  await ProblemType.collection.createIndex(COMPOUND_INDEX_KEY, {
    unique: true,
    name: COMPOUND_INDEX_NAME,
  });
  console.log(`Ensured unique compound index: ${COMPOUND_INDEX_NAME}`);

  const indexes = await ProblemType.collection.indexes();
  const legacyNameIndexes = indexes.filter(
    (index) => index.unique && keysEqual(index.key, LEGACY_NAME_INDEX_KEY)
  );

  for (const index of legacyNameIndexes) {
    await ProblemType.collection.dropIndex(index.name);
    console.log(`Dropped legacy unique index: ${index.name}`);
  }

  if (!legacyNameIndexes.length) {
    console.log("No legacy unique name index found");
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
