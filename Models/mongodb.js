const fs = require('fs'); 
const Json2csvParser = require("json2csv").Parser;
const categoryEntries = require('./categoryEntries');

const MongoDB = {
    
    export2csv: async function () {
        categoryEntries.find({},{_id:0, __v:0}).lean().exec((err, data) => {
            if (err) throw err;
            const csvFields = ['firstname','lastname', 'username' ,'email', 'category'];
            const json2csvParser = new Json2csvParser({
                csvFields
            });
            const csvData = json2csvParser.parse(data);
            fs.writeFile("Utils/bigML/EntrancesDetails.csv", csvData, function(error) {
                if (error) throw error;
                console.log("Write to EntrancesDetails.csv successfully!");
            });
        });
    }
}

module.exports = MongoDB;