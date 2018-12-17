/**
 * uses functionality defined in site_functions.js
 */
 
//load blog posts from github into blog_posts div:
get_posts(document.getElementById('blog_posts'), document.getElementById('tokenText').value);
fetch_posts = () =>{
 console.debug(this.value);
}
