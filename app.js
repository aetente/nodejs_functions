const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

let metricsLocation = "./metrics.json";
let identitiesLocation = "./identities.json";

let args = process.argv.slice(2);

if (args[0]) {
  metricsLocation = args[0];
}

if (args[1]) {
  identitiesLocation = args[1];
}


fs.readFile(metricsLocation, 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  let dataJSON = JSON.parse(data).metricsCustomFilters;
  let startingMetric = null
  let sameMetrics = [];
  let resArr = []

  // we just iterate for each metric checking each metric
  for (const [start_key, start_value] of Object.entries(dataJSON)) {
    startingMetric = start_value;
    // we will be adding metrics if their value are the same
    sameMetrics.push(start_key);
    for (const [key, value] of Object.entries(dataJSON)) {
      // we sort the data just in case they are the same but were written in different order
      if (start_key != key && JSON.stringify(startingMetric.sort()) == JSON.stringify(value.sort())) {
        sameMetrics.push(key);
      }
    }
    let res = null;
    if (sameMetrics.length > 1) {
      res = {
        "metrics": sameMetrics,
        "filters": startingMetric
      };
    }
    if (res) {
      let alreadyExists = false;
      // check if same metrics were already added
      for (let i = 0; i < resArr.length; i++) {
        let resEl = resArr[i];
        if (JSON.stringify(resEl.metrics.sort()) == JSON.stringify(res.metrics.sort())) {
          alreadyExists = true;
          break;
        }
      }
      if (!alreadyExists) {
        resArr.push(res);
      }
    }
    sameMetrics = [];
  }
  console.log(resArr);
  nextRead(resArr)
})

function mergeObjects(identitiesArr) {
  let startingObj = null
  let resArr = []
  startingObj = identitiesArr[0];
  for (let j = 0; j < identitiesArr.length; j++) {
    // I thought we needed to merge those that have any same field values
    // while we need to just merge all objects into one
    // it should be easier then
    
    for (let k = 0; k < identitiesArr.length; k++) {
      if (k != j) {
        // add missing fields
        let objToCompare = identitiesArr[k];
        for (const [key, value] of Object.entries(objToCompare)) {
          if (!startingObj[key]) {
            startingObj[key] = value;
          } else if(value) {
            // made sure the value we add is not null
            // we do Set to remove duplicates
            startingObj[key] = [...new Set([].concat(startingObj[key], value))];
            addedFields = true;
          }
        }
      }
    }
  }
  resArr.push(startingObj);
  return resArr;
}


function nextRead(res) {
  fs.readFile(identitiesLocation, 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    let identitiesArr = JSON.parse(data).identities;
    let resArr = mergeObjects(identitiesArr);

    console.log(resArr);
    startServer([res, resArr]);
  })
}

function startServer(resValue){
  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(JSON.stringify(resValue));
  });
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}
