/**
 * uses functionality defined in site_functions.js
 *
 * 
 * we rely on code at https://crockford.com/javascript/private.html
 * for object encapsulation
 * TODO - verify these encapsulation techniques actually work
 */
function ContentHandler(){
  this.gitHubBroker = new GitHubBroker();
  //save reference to this for use in privileged methods
  self = this;
  self.oauthToken = '';
  self.setOauthToken = (tokenValue) => {
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

ContentHandler.prototype.createPost = (post_text) => {
  console.debug('posting text: ', post_text);
  self.gitHubBroker.save_post(post_text, self.oauthToken);
}
