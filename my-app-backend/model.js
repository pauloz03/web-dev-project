import mongoose from "mongoose";

//for me since this is my first time using mongodb>
//A schema is a JSON object that defines the structure and contents of 
// your data. You can use Atlas App Services' BSON schemas, which extend the 
// JSON Schema standard, to define your application's data model and validate 
// documents whenever they're created, changed, or deleted.

//Schemas represent types of data rather than specific values. App Services 
// supports many built-in schema types. These include primitives, like strings
//  and numbers, as well as structural types, like objects and arrays, which you 
// can combine to create schemas that represent custom object types.

//Schemas are the specification for your application's data model. Once you've 
// defined a schema, App Services provides you with additional tools and services 
// to work with data that conforms to the schema.

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    authorUsername: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
