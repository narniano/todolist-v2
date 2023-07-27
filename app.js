//jshint esversion:6

import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import _ from "lodash"

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const connectToMongo = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://rilsonjoas10:r4FbzoysDdVvu27W@cluster0.aeyrby2.mongodb.net/todolistDB",
      {
        useNewUrlParser: true,
      }
    );
    console.log("connected to MongoDB");
  } catch (error) {
    console.log("error connection to MongoDB:", error.message);
  }
};
connectToMongo();

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add an item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  const foundItens = await Item.find({});

  if (foundItens.length === 0) {
    Item.insertMany(defaultItems);
  } else {
    res.render("list", { listTitle: "Today", newListItems: foundItens });
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  try {
    const foundItem = await List.findOne({ name: customListName });
    res.render("list", {
      listTitle: foundItem.name,
      newListItems: foundItem.items,
    });
  } catch (err) {
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    list.save();
    res.redirect("/" + customListName);
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem; //a partir do input do form
  const listName = req.body.list; //a partir do submit do button

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    async function newList() {
      try {
        const foundList = await List.findOne({ name: listName });
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      } catch (err) {
        console.log(err.msg);
      }
    }
    newList();
  }
});

app.post("/delete", async function (req, res) {
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      const removeList = await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    } else {
      const removeList = await List.findOneAndUpdate({name: listName}, {
        $pull: { items: { _id: checkedItemId } },
      });
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.log(err.msg);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
