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
}
/**
 * fetches post using OAUTH token for authentication
 *
 * @param tokenText: DOM text input element, mean to hold an OAUTH token
 */
ContentHandler.prototype.fetchPosts = (blogPostsDiv, oauthToken) => {
  console.debug('ContentHandler::fetchPosts: oauthToken = ', oauthToken);
  self.gitHubBroker.get_posts(blogPostsDiv, oauthToken);
 }

ContentHandler.prototype.createPost = (post_text, oauthToken) => {
  console.debug('ContentHandler::createPost posting text: ', post_text);
  console.debug('ContentHandler::createPost oauthToken: ', oauthToken);
  self.gitHubBroker.save_post(post_text, oauthToken);
}
