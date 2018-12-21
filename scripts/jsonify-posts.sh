#!/bin/bash
for file_name in $(ls *html); do
  post_time=$(stat -c %Y $file_name);
  new_file_name="${file_name%%.*}".json
  echo \{ \'post_change_time\' : \'$post_time\', > $new_file_name
  echo \'post_content\': \'$(sed 's/\n//g' $file_name)\'\} >> $new_file_name
  cat $new_file_name
done
