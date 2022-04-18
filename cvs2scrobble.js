/** 
 * Scrobble Uploader
 * @author Colter Nichols
 */
 const puppeteer = require('puppeteer');
 const csv = require('csv-parser');
 const fs = require('fs');
 const listeningHistory = [];
 // enter your last.fm username and password
 let username = 'username';
 let password = 'password';

 // enter csv file name
 let file = 'ALH.csv';
 
 /**
  * Reads csv file and inputs it into listeningHistory array
  * 
  * @param file the csv file your listening history is on
  */
 fs.createReadStream(file)
       .pipe(csv({}))
       .on('data', (data) => listeningHistory.push(data))
       .on('end', () => { 
         main();
       })  
 /**
  * main function logs in and traverses through the listeningHistory array inserting artist and title 
  * into text inputs
  * 
  * @returns false if open scrobbler will not enter in any more scrobbles into last.fm
  */
 async function main() {
   // opens browser to login screen in non headless mode
   const browser = await puppeteer.launch({ headless: false});
   const page = await browser.newPage();
   await page.goto('https://www.last.fm/login?next=/api/auth%3Fapi_key%3D0aa2e9944f3e38f7a64358dde668ff63%26cb%3Dhttps%3A//openscrobbler.com/');
     
   // enters username and password into text inputs
   await page.type('#id_username_or_email', username);
   await page.type('#id_password', password);
 
   // will wait to continue until navigated to new tab
   await Promise.all([
     page.waitForNavigation(), 
     // clicks to submit login information
     page.click('button[name = "submit"]'), 
   ]);
 
   // will wait to continue until navigated to new tab
   await Promise.all([
     page.waitForNavigation(), 
     // click to confirm login 
     page.click('button[name = "confirm"]'), 
   ]);
   
   // streams counted so you can veiw how many streams have been counted about
   var streamsCounted = 0
    
   // traversing through listeningHistory array
     for await (const stream of listeningHistory) {
       streamsCounted++
       console.log(streamsCounted);
       // count keeps track of what property we are on of the stream
       var count = 0
       
       // traversing through object(stream) within listeningHistory
       for (const property in stream) {
         count++;
         var prop = `${stream[property]}`
          
         // if we are at the second property within stream type the title into title input
         if (count == 2){
           await page.waitForSelector("#title");
           await page.type("#title", prop);
           // if we are at the third property within stream type the artist into the artist input        
         } else if (count == 3){
           await page.waitForSelector("#artist");
           await page.type("#artist", prop);
           let error = (await page.$('div[role = "alert"]'));
           
           // if too many streams error shows up, return false
           if (error != null) {
             await browser.close();
             console.log("Too many streams");
             return false;
           }
 
           // will wait to continue until clear history button is shown
           await Promise.all([
             page.waitForSelector('button[class = "btn-clear btn btn-secondary btn-sm"]'), 
             page.click('button[tabindex = "4"]'), 
           ]);
           
           // waits for the clear history button to be hidden
           await Promise.all([
             page.click('button[class = "btn-clear btn btn-secondary btn-sm"]'), 
             page.waitForSelector('button[class = "btn-clear btn btn-secondary btn-sm"]', {hidden: true}), 
           ]);
 
         }    
       }
     }
 
   await browser.close();  
 }
  