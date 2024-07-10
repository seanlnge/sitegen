# Template Refining
***
The templates used in SiteGEN are from https://html5up.net. To start template refining, move the whole template folder into `templates/`, this should allow the template's files and file structure to be found under `templates/[name]/` 

### Global Files
The global files that are mutually shared between the other templates can be removed. If any files that should be deemed global are not found in `templates/global`, add them to the global folder. The folder `templates/global/` should have identical file structure to all templates.

### Unique Files
Files that cannot be deemed as global should stay in `templates/[name]/` and be manually entered into `src/template.ts` as `[name]_COPYFILE_STRUCTURE`, and a mapping between name and \[NAME\]_COPYFILE_STRUCTURE should be added into the `TEMPLATE_MAP` constant under `TemplateBuilder.build()`.

### index.html
Include this comment at the top of the script under <!DOCTYPE html> to give model further guidance.
```html
<!--
EXTRA INSTRUCTIONS FOR MODEL:
All entry points will be inside of dollar signs
If an entry point title is prefixed with "POTENTIAL", only add if the extra information would benefit the website
IMAGE_X_SRC must not be edited, do not add into final JSON
Utilize other HTML tags inside of data entry points if it would benefit the website
Although you may use HTML tags, you may not close any tags that you have not opened previously in the same entry
After data entry, this will be the final rendition of the website, so ensure that the website will meet the client's needs.
-->
```
Remove all Latin filler text (lorem ipsum dolor sit amet) and replace with data entry tags $NAME$. Data entry tags will always be between two dollar signs, and attempt to name the tag close to what its purpose is. For example $HEADER$, $MAIN_MOTTO$, and $ARTICLE_2_PARAGRAPH$ are all valid tags. Add $POTENTIAL_EXTRA_SECTION$ below the main div in <body> to allow model to place more HTML if needed.

### \[name\].png
This is the showcase picture that the model sees when choosing a template. Screenshot taken from Google Chrome in inspect element displaying an iPhone 12 Pro. Take the screenshot and cut into it horizontally such that when the slices are pieced back together in a row, it is as close to a square as possible.

### showcase.png
This is the exact same picture as `\[name\].png`, however, over all the images on the page, write in `IMAGE_A` in a large bold black font, then `IMAGE_B`, etc, in alphabetical order from top to bottom. This image allows the model to see where to place the different images. Alter any image tags inside index.html or any url() with the image inside of assets/css/main.css and write in the data entry tag `$IMAGE_A_SRC$`, `$IMAGE_B_SRC$`, etc, in the src or the url in order from top to bottom. Ensure that no two image data entry tags are used twice. In the index.html file, add `$IMAGE_X_ALT$` to the alt tag next to src where X is the image letter that the alt corresponds with.