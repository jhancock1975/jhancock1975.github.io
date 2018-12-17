/**
 * uses functionality defined in site_functions.js
 */
 
//load blog posts from github into blog_posts div:
fetchPosts = (tokenText) => {
 get_posts(document.getElementById('blog_posts'), tokenText.value);
}
