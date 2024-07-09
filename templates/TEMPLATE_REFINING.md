# Template Refining
***
The templates used in SiteGEN are from https://html5up.net. To start template refining, move the whole template folder into `templates/`, this should allow the template's files and file structure to be found under `templates/[name]/` 

### Global Files
The global files that are mutually shared between the other templates can be removed. If any files that should be deemed global are not found in `templates/global`, add them to the global folder. The folder `templates/global/` should have identical file structure to all templates.

### Unique Files
Files that cannot be deemed as global should stay in `templates/[name]/` and be manually entered into `src/template.ts` as `[name]_COPYFILE_STRUCTURE`, and a mapping between name and \[NAME\]_COPYFILE_STRUCTURE should be added into the `TEMPLATE_MAP` constant under `TemplateBuilder.build()`.

### index.html
All of the img tags inside of `index.html` should be adjusted to have the exact text of `<img src="IMAGE_A" alt="IMAGE_A" />` where `IMAGE_A` becomes `IMAGE_B`, then `IMAGE_C`, etc, in alphabetical order from top to bottom. Exact spacing must be followed.

### \[name\].png
This is the showcase picture that the model sees when choosing a template. Screenshot taken from Google Chrome in inspect element displaying an iPhone 12 Pro. Take the screenshot and cut into it horizontally such that when the slices are pieced back together in a row, it is as close to a square as possible.

### showcase.png
This is the exact same picture as `\[name\].png`, however, over all the images on the page, write in `IMAGE_A` in a large bold black font, then `IMAGE_B`, etc, in alphabetical order from top to bottom. This image allows the model to see where to place the different images.