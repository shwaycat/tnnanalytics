# CRONTAB

```
*/15 * * * *   cd current && node scripts/pull-facebook.js &>>log/pull-facebook.log
*/15 1-3,5-7,9-11,13-15,17-19,21-23 * * *   cd current && node scripts/pull-twitter.js &>>log/pull-twitter.log
15,30,45 */4 * * *   cd current && node scripts/pull-twitter.js &>>log/pull-twitter.log
0 */4 * * *   cd current && node scripts/pull-twitter.js --all &>>log/pull-twitter-all.log
*/3 * * * *    cd current && node scripts/notify.js &>>log/notify.log
```
