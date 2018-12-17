/**
* uses functionality defined in site_functions.js
*/
function ContentHandler(){
 gitHubBroker = new GitHubBroker();
 //load blog posts from github into blog_posts div:
 gitHubBroker.get_posts(document.getElementById('blog_posts'));

 /**
 * event handler for when OAUTH text box token is set
 *
 * @param tokenText: DOM text input element, mean to hold an OAUTH token
 */
 ContentHander.prototype.fetchPosts = (tokenText) => {
  gitHubBroker.get_posts(document.getElementById('blog_posts'), tokenText.value);
 }
}
