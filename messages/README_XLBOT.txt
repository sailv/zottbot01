In excel the First column should be the Jump Label it can be numbers or string labels Q1,Q2, Q3 etc.

Second Column should be the Prompt String like  "What is the Loan Amount ?"

Third Column should be the Edit Box that will receive the User Input.
If this column is a label then the system automatically process the next JumpTo Row without waiting for user input.

Forth Column should be the JumpTo Label which will be a formula based on Inputs Entered.


Fifth Column is the Message to display in case JumpTo Label is not valid, this is used to
display Error Messages. The State remains in the same row so that user can reenter the data.

##############################################################################################

Ex:

J0	Welcome				___		J1
J1	Enter Principle		___		J2

##############################################################################################
#Types.
##############################################################################################
Column 2 (Prompt String) can be named with Name.Type to change the behaviour of the prompt.

###################
ex: t1.text

###################################################################################
Cell Type		Column 2 Cell Name		Column 2 Cell Contents					
--------------------------------------------------------------------------------
Text			t1.text					Enter a Principle


-------------------------------------------------------

Date			d1.date					Enter Date of Birth
						
										A Date Selection widget is displayed
										When user selects the date and presses OK the selected
										date is sent

-------------------------------------------------------

GPS				d1.gps					Please Share Locatopn 
						
										A "Share Location" button is displayed
										When user selects the button the Logitude and Lattitue is sent.
-------------------------------------------------------

Image			i1.image				1.jpg (Name of the Image)					

										Image is displayed

-------------------------------------------------------

Link			l1.link					Label|URL to link to.
										Goto Google|http://google.co.in

										A Clickable Link is displayed
										
-------------------------------------------------------
																				
Download		d1.download				Label|URL of the file to download.
										DownloadFile|data.zip
										
										A Clickable Link is displayed

-------------------------------------------------------

ButtonList		bl1.buttonlist			Value|Label		as a Data Validation -> List 
										1|Option 1
										2|Option 2
										3|Option 3
										
										A set of buttons are displayed
										When the user clicks a button the corresponding Value is sent.
										
-------------------------------------------------------
										
ButtonLinks		bk1.buttonlinks			URL|Label		as a Data Validation -> List 
										?a=612|Start App 612
										?a=613|Start App 613
										?a=614|Start App 614
										
										A set of buttons are displayed
										When the user clicks a button the corresponding URL is loaded.
										
-------------------------------------------------------
										
										
ImageButton	im1.imagebutton				ImageName|Desc|BttonV1|BttonL1|BttonV2|BttonL2 ...	as a regular string.
										1.jpg|Desc|11|Option 11|12|Option 12|13|Option 13

										
										Displays a Image followed by a List of buttons to select.
										When the user selects an image the corresponding value is sent back
										
-------------------------------------------------------
										
										
ImageButtonList	im1.imagebuttonlist		Value|Image Name		as a Data Validation -> List 
										1|1.jpg
										2|2.jpg
										3|3.jpg
										
										A list of Images are displayed.
										When the user selects an image the corresponding value is sent back
										
-------------------------------------------------------										
										
									
ImageButton		ib1.imagebutton			Image|Description|BtnVal1|BtnLabel1|BtnVal2|BtnLabel2...			
											as a Data Validation -> List 

										1.jpg|Desc|11|Option 11|12|Option 12|13|Option 13
										2.jpg|Desc|21|Option 21|22|Option 22|23|Option 23
										3.jpg|Desc|31|Option 31|32|Option 32|33|Option 33


										This is a 2F Array with Image with a set of buttons
										at the bottom at each image.


----------------------------------------------------------------------------


##############################################################################################

Column 3 (Data result column) cells can also have Data Validation -> List set. The belaviour
will be similar to ButtonList where the user is presented with a list of options to select from
as buttons.

##############################################################################################
Added May 31

Column 6 has the WebService URL to hit to get some value.
Column 7 has the Data that will be posted to the above URL.
Column 8 will be populated with the data that was received from WebService.

The Webservice can return a Text which will be populated in Column 8.
If the Webservice returns JSON data then cells with the names starting
with underscore _ and the Name in the JSON array will be located and value populated.

For Example, If the following JSON is sent by the PHP webservice the
Cell Named _Data1 will be populated with 100
Cell Named _Data2 will be populated with 200 and so on.

<?php

$Data=$_POST["Data"];
//echo "Thankyou for $Data";


echo json_encode( [ "Sent Data" => "Hello There --- $Data ",
					"Data1" => "100",
					"Data2" => "200",
					"Data3" => "300",
					"Data4" => "400",
					"Data5" => "500"
						]);

?>
#############################################################################################

