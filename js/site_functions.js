/**
 * Convenience method for making API call.
 * 
 * @author: jhancock1975
 * @param api_category: github API category name, example: repos
 * @param api_method: github API endpoint method, example: contents
 * @param api_params: github method parameters, example: posts (the name of some directory)
 */
github_api_call = async(api_category, api_method, api_params, tokenText) => {
  url_str = site_settings[base_url]+'/'+ api_category + '/' + site_settings[user_id] 
    + '/' + site_settings[repo_name] + '/' + api_method + '/' + api_params;
  var headers_obj = {'Accept': 'application/vnd.github.v3+json'};
  if (tokenText !== ""){
    console.debug('setting oath token value ', tokenText);
    headers_obj['Authorization'] = 'token ' + tokenText;
  } else {
    console.debug('The token_val is blank, I am not using authorization for API calls.');
  }
  var response = await fetch(url_str, 
                         {method : 'GET', 
                          headers: headers_obj
                         });
  var response_json = await response.json();
  return response_json;
}
const name = 'name';
const content = 'content';
/**
 * This function gets blog posts from a github repository
 * it expects there to be a directory called posts in the
 * top level of the repository, and attaches the posts
 * to child divs of postDiv
 *
 * @param postDiv: DOM object that we attach blog posts to
 */
get_posts = async(postDiv, tokenText) => {
   github_api_call('repos', 'contents', 'posts', tokenText)
     .then((blog_posts) => {
       //we have the list of blog posts
       //TODO: recursively traverse contents
       blog_posts.map((blog_post) => {
         github_api_call('repos', 'contents', 'posts'+'/'+blog_post[name], tokenText)
           .then((blog_post) => {
             //we have the individual posts
             console.debug('blog_post ', blog_post);
             var newPostDiv = document.createElement('div');
             newPostDiv.innerHTML = atob(blog_post[content]);
             postDiv.appendChild(newPostDiv);
         })
       })
   })
}
