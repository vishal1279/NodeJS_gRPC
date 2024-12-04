require("dotenv").config();
const grpc = require("@grpc/grpc-js");
const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const PROTO_PATH = "./proto/todo.proto";
const protoLoader = require("@grpc/proto-loader");
const todoProto = grpc.loadPackageDefinition(protoLoader.loadSync(PROTO_PATH));

const server = new grpc.Server();

// MongoDB setup
const uri = "mongodb://mongo:27017"; // MongoDB connection string
/*
// Define the database URL to connect to.
const mongoDB = "mongodb://root:example@localhost:27017/todoApp?authSource=admin";
// Wait for database to connect, logging an error if there is a problem

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(
    mongoDB
).then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
}

// Define a schema
const Schema = mongoose.Schema;

const appSchema = new Schema({
  title: String,
  description: String,
});

// Compile model from schema
const appModel = mongoose.model("todos", appSchema);

const newEntry = new appModel({"title":"Test Title", "description":"Test description"});
newEntry.save().then((doc) => {
    console.log(doc);
  })
  .catch((err) => {
    console.error(err);
  });
*/
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const dbName = "todoApp";
let db;

// Connect to MongoDB
client
  .connect()
  .then(() => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

// gRPC service methods
const createTodo = async (call, callback) => {
  const { title, description } = call.request;

  if (!title || !description) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Title and description are required",
    });
    return;
  }

  try {
    const objToBeInsert = {
      title,
      description,
      createdAt: new Date(),
    };
    const result = await db.collection("todos").insertOne(objToBeInsert);
    const response = { ...objToBeInsert, id: result.insertedId.toString() };

    console.log(response);
    callback(null, { message: result.insertedId.toString() }); // Return the inserted ID as a string
  } catch (err) {
    callback({
      code: grpc.status.INTERNAL,
      details: `Error inserting todo: ${err.message}`,
    });
  }
};

const todos = [];

const GetTodos = async (call, callback) => {
  try {
    // Example: Fetching todos from a database (static array used here for simplicity)
    const result = await db.collection("todos").find().toArray();

    const todosList = result.map((todo) => ({
      id: todo._id.toString(),
      title: todo.title,
      description: todo.description,
    }));

    // Return the todos as a TodoList
    callback(null, { todos: todosList });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: `Error fetching todos: ${error.message}`,
    });
  }
};

const DeleteTodo = async (call, callback) => {
  const { id } = call.request;
  db.collection("todos").deleteOne({ _id: new ObjectId(id) });
  callback(null, { message: "Record deleted" });
};
// gRPC server setup
server.addService(todoProto.TodoService.service, {
  createTodo,
  GetTodos,
  DeleteTodo,
});

const PORT = 50051;

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error("Server failed to bind:", error);
      return;
    }
    console.log(`gRPC server running at http://localhost:${port}`);
    server.start();
  }
);
