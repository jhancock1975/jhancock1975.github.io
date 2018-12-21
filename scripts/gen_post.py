import json
import os
import re

for file_name in os.listdir("."):
  if file_name.endswith(".json"):
    with open(file_name, 'r') as input_file:
      cleanedData = re.sub('[\n\t]', '', input_file.read())
      file_contents = json.loads(cleanedData)
      print(file_contents['post_content'])
