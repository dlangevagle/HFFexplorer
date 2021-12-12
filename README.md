### HFFexplorer README (example field: A2744-clu)

### Website Files:
<b>index.html</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
Front-end HTML/CSS/JavaScript for rendering the website.
<br>
<br>
<b>astro-id.js</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
JavaScript functions for handling all the backend website functionality.
<br>
<br>
<b>JSON/hff.json</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
JSON file with information pertaining to the HFF field and catalogs.
<br>
<br>
<b>A2744-clu/images/</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
Folder containing all the A2744-clu RGB color images and segmentation map.
<br>
<br>
<b>A2744-clu/JSON/seg/</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
Folder containing all the segmentation data split into files based on the x-coordinate. These files are used to
<br>&nbsp;&nbsp;&nbsp;&nbsp;
look up the source id associated with the (x, y) coordinate clicked on by a user. For example, line 1977 in 3671.js
<br>&nbsp;&nbsp;&nbsp;&nbsp;
corresponds to (x, y)=(3671, 1977). The entry on that line is 3501, which is the id of the source found at that
<br>&nbsp;&nbsp;&nbsp;&nbsp;
coordinate.
<br>
<br>
<b>A2744-clu/JSON/XY/xy.js</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
File with the catalog x and y coordinates for each source. x-coordinate entries are listed first, followed by
<br>&nbsp;&nbsp;&nbsp;&nbsp;
y-coordinate entries. For example, the x-coordinate of the source with id 3501 can be found on line 3501 and the
<br>&nbsp;&nbsp;&nbsp;&nbsp;
y-coordinate can be found on line len(catalog)+3501=9390+3501=12891.
<br>
<br>
<b>A2744-clu/JSON/info.json</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
JSON file with information pertaining to the A2744-clu field, including individual data table entries for each
<br>&nbsp;&nbsp;&nbsp;&nbsp;
catalog source.
<br>

### Python Scripts used to create the website files (found in the python_scripts/ directory):
<b>figgen.py</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
<br>
<br>
<b>jsonmaker.py</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
<br>
<br>
<b>pagegen.py</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
<br>
<br>
<b>radecgen.py</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
<br>
<br>
<b>segtools.py</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;
<br>
<br>
<b>xygen.py</b>
<br>&nbsp;&nbsp;&nbsp;&nbsp;