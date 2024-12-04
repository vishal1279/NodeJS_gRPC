const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = "./proto/todo.proto";

// Load proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const todoProto = grpc.loadPackageDefinition(packageDefinition);

const client = new todoProto.TodoService(
  "grpc-server:50051",
  grpc.credentials.createInsecure()
);

// Call CreateTodo
client.CreateTodo(
  { title: "Sample Task", description: "This is a sample task" },
  (err, response) => {
    if (err) console.error(err);
    else console.log(response.message);
  }
);

/*
// Call GetTodos
client.GetTodos({}, (err, response) => {
  if (err) console.error(err);
  else console.log("Todos:", response.todos);
});
/*
// Call DeleteTodo
client.DeleteTodo({ id: "INSERT_TODO_ID_HERE" }, (err, response) => {
  if (err) console.error(err);
  else console.log(response.message);
}); */
