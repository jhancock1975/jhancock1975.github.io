/**
* uses functionality defined in site_functions.js
*/
function ContentHandler(){
  var gitHubBroker = new GitHubBroker();
  var oauthToken; 
  setOauthToken = (tokenValue) => {
    oauthToken = tokenValue; 
 }
}
/**
 * fetches post using OAUTH token for authentication
 *
 * @param tokenText: DOM text input element, mean to hold an OAUTH token
 */
ContentHandler.prototype.fetchPosts = (blogPostsDiv) => {
  this.gitHubBroker.get_posts(blogPostsDiv, oauthToken);
 }