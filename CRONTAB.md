# CRONTAB

```
# Facebook pulls every 15 min
*/15 * * * *        cd current && node scripts/pull-facebook.js &>>log/pull-facebook.log

# Twitter Pulls once every 15 min and ALL every 4 hours
*/15 1-3,5-7,9-11,13-15,17-19,21-23 * * *   cd current && node scripts/pull-twitter.js &>>log/pull-twitter.log
15,30,45 */4 * * *  cd current && node scripts/pull-twitter.js &>>log/pull-twitter.log
0 */4 * * *         cd current && node scripts/pull-twitter.js --all &>>log/pull-twitter-all.log

# Instagram Pulls once every 30 min and ALL every 4 hours
*/30 1-3,5-7,9-11,13-15,17-19,21-23 * * *   cd current && node scripts/pull-instagram.js &>>log/pull-instagram.log
30 */4 * * *        cd current && node scripts/pull-instagram.js &>>log/pull-instagram.log
0 */4 * * *         cd current && node scripts/pull-instagram.js --all &>>log/pull-instagram-all.log

# YouTube pulls every 30 min. All pulls are ALL pulls.
*/30 * * * *        cd current && node scripts/pull-youtube.js &>>log/pull-youtube.log

# Google+ pulls every 30 min. All pulls are ALL pulls.
*/30 * * * *        cd current && node scripts/pull-googleplus.js &>>log/pull-googleplus.log

# Google Analytics pulls every 6 hours.
* */6 * * *         cd current && node scripts/pull-google-analytics.js &>>log/pull-google-analytics.log

# Refresh OAuth tokens every 5 minutes.
*/5 * * * *         cd current && node scripts/oauth-refresh.js &>>log/oauth-refresh.log

# Run Notify every 3 min.
*/3 * * * *         cd current && node scripts/notify.js &>>log/notify.log

```
