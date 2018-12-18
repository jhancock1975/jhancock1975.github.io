/**
* uses functionality defined in site_functions.js
*/
function ContentHandler(){
  this.gitHubBroker = new GitHubBroker();
  self = this;
  self.oathToken = '';
  setOauthToken = (tokenValue) => {
    self.oauthToken = tokenValue; 
 }
}
/**
 * fetches post using OAUTH token for authentication
 *
 * @param tokenText: DOM text input element, mean to hold an OAUTH token
 */
ContentHandler.prototype.fetchPosts = (blogPostsDiv) => {
  self.gitHubBroker.get_posts(blogPostsDiv, self.oauthToken);
 }
