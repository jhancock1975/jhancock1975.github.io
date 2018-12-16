site_settings = async() => {
   url_str = 'https://api.github.com/repos/' + user_id + '/jhancock1975.github.io/js/site_settings.json/';
   response = await(url_str)
   site_settings = await response.json();
   console.debug('site settings ', site_settings);
}
const site_settings = await site_settings();
list_files = async (user_id) => {
   url_str = 'https://api.github.com/repos/' + user_id + '/jhancock1975.github.io/contents/';
   response = await fetch(url_str);
   file_list = await response.json(); //extract JSON from the http response
  console.log("file_list ", myJson)
}
get_posts = async (user_id, post_element_id) => {
   url_str = 'https://api.github.com/repos/' + user_id + '/jhancock1975.github.io/contents/';
   response = await fetch(url_str);
   myJson = await response.json(); //extract JSON from the http response
  console.log("myJson ", myJson)
}
