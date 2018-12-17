/**
* uses functionality defined in site_functions.js
*/
function ContentHandler(){
 gitHubBroker = new GitHubBroker();
 //load blog posts from github into blog_posts div:
 gitHubBroker.get_posts(document.getElementById('blog_posts'));
}
/**
 * fetches post using OAUTH token for authentication
 *
 * @param tokenText: DOM text input element, mean to hold an OAUTH token
 */
ContentHandler.prototype.fetchPosts = (tokenText) => {
  gitHubBroker.get_posts(document.getElementById('blog_posts'), tokenText.value);
 }
