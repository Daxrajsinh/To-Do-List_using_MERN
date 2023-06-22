const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");  //Lower Dash i think NOT SURE. but it is V. imp

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));  //(MUST) Explicitly providing path of public where extra .css, etc Static files are present.

const url = "mongodb://127.0.0.1:27017/ToDoListDB";

//Setting up Mongoose
mongoose.connect(url, {useNewUrlParser: true}).then((ans) => {
    console.log("Connected Successfully to MongoDB database!")
}).catch((err) => {
    console.log("Error in the Connection")
})

const itemSchema = {
    name: String
};

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
    name : "Welcome to your to-do List"
});
const item2 = new Item({
    name : "Hit the + button to add a new item"
});
const item3 = new Item({
    name : "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema]   // an array of type itemSchema
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    
    Item.find({})
    .then((foundItems) => {

        if(foundItems.length === 0) {       // Inorder to avoid Dupes, everytime it is calling thats why this conidition will take care of it.
            Item.insertMany(defaultItems)
            .then(() => {
                console.log("Successfully added all the items to todoListDB");
            })
            .catch((err) => {
                console.log(err);
            });
        }

        res.render("list", { listtitle: "Today", NewItem: foundItems});  // rendering all the foundItems arr
    })
    .catch((err) => {
        console.log(err);
    });
})

//Whenever user types new list, such as localhost:3000/Work then "Work" will get display here.
//bcuz of /: it can accept random name
app.get("/:customListName", function(req, res){
    //INORDER TO MAKE NO DIFFERENTIATION B/w "/Home" and "/home"
    const customListName = _.capitalize(req.params.customListName); 
    
    // console.log(customListName);

    // INORDER TO AVOID ADDING LIST WITH SAME NAME
    List.findOne({name: customListName})
    .then((foundList)=> {
        if(! foundList) {
            // console.log("New List added, as it does not exist");
            
            //create a new list if is not already present.
            const list = new List({
                name: customListName,
                items:defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
            // console.log("List already exists !");
            //showing already exisiting list.
            res.render("list", { listtitle: foundList.name, NewItem: foundList.items})
        }
    })
    .catch((err)=>{
        console.log(err);
    })
})

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    //Creating item document (i.e. Data) to insert
    const item = new Item({
        name: itemName
    })

    if(listName === "Today") {        // If list is Today, then simply save and redirect to default.
        // Item.insertOne(item)
        // .then(() => {
        //     console.log("Successfully added item to todoListDB");
        // })
        // .catch((err) => {
        //     console.log(err);
        // });

        // IS SAME AS (Shortcut)

        item.save();
        res.redirect("/");
    } else {
        //Search the list name where we are adding the new list and needs to add there, NOT in the default list.

        List.findOne({name: listName})
        .then((foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);  // redirect and save to the list where we are actually adding the item.
        })
        .catch((err) => {
            console.log(err);
        });
        
    }

    
})

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;


    //Earlier it was deleting all the items from Today, 
    // hence placing this condition will delete and update the array of custom list items
    if(listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
        .then(()=> {
            console.log("Successfully deleted the selected Item");
            res.redirect("/");  // Inorder to actually reflect the changes, everytime it is required.
        })
        .catch((err)=>{
            console.log(err);
        })
    } else {
        //Pulling means only deleting that item from custom list and updating.
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}})
        .then(()=>{
            res.redirect("/" + listName);
        }) 
    }
})

app.listen(3000, function () {
    console.log("Server started on Port 3000");
})
