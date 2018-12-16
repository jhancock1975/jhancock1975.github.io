list_files = async () => {
  url_str = 'https://api.github.com/repos/' + site_settings['user_id'] + '/' 
      + site_settings['repo_name'] + '/contents/';
  response = await fetch(url_str);
  file_list = await response.json();
  console.log("file_list ", myJson)
}

get_posts = async (post_element_id) => {
  url_str = 'https://api.github.com/repos/' + site_settings['user_id'] + '/' 
      + site_settings['repo_name'] +'/contents/';
  response = await fetch(url_str);
  postsJson = await response.json();
  posts_div = document.getElementById('blog_posts');
  posts_div.innerText = postsJson;
}
/**
 * Convenience method for making API call.
 * 
 * @author: jhancock1975
 * @param api_method: github api endpoint method, example: repos/contents
 * @param api_params: github method parameters, example: posts
 */
github_api_call = async(api_method, api_params) => {
  url_str = site_settings[base_url]+'/'+site_settings[user_id] + '/' + site_settings[repo_name] 
    + '/' + api_method + '/' + api_params;
  response = await fetch(url_str);
  response_json = await response.json();
  return response_json;
}
