const site_settings = {'user_id' : 'jhancock_1975', 
                 'repo_name' : 'jhancock1975.github.io', 
                 'posts_location' : 'posts'};

list_files = async () => {
  url_str = 'https://api.github.com/repos/' + site_settings['user_id'] + '/' 
      + site_settings['repo_name'] + '/contents/';
  response = await fetch(url_str);
  file_list = await response.json(); //extract JSON from the http response
  console.log("file_list ", myJson)
}

get_posts = async (post_element_id) => {
  url_str = 'https://api.github.com/repos/' + site_settings['user_id'] + '/' 
      + site_settings['repo_name'] +'/contents/';
  response = await fetch(url_str);
  postsJson = await response.json(); //extract JSON from the http response
  posts_div = document.getElementById('blog_posts');
  posts.innerText = postsJson;
}
