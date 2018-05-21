var fs = require("fs");

//create an n zero matrix
var zeros = function(n) {
    if(typeof(n)==='undefined' || isNaN(n)) { return []; }
    if(typeof ArrayBuffer === 'undefined') {
      // lacking browser support
      var arr = new Array(n);
      for(var i=0;i<n;i++) { arr[i]= 0; }
      return arr;
    } else {
      return new Float64Array(n);
    }
 }

/**
*@param filename
*@return an object:name of the rows,coulumn and the data
**/
function readfile(filename){

	//read file synchronously and split by newline to an array
	var lines = fs.readFileSync(filename).toString().split("\n");

	var colnames = lines[0].trim().split('\t');//get the first index which is the column(word in each blog)
	var p,l=[];
	var rownames= [];//store each rownames
	var data =[];//store the matrix data
	lines.shift();// delete the column from the data.
	for(var line in lines){
		 p= lines[line].trim().split('\t');//convert the string to array base on the tab

		rownames.push(p[0]);//index 0 is the name of the row(the title of the blog)

		p.shift();//remove the title

		
		data.push(p);//store the values
			
	}
	var data2=new Array(data.length);
	for(var i=0;i<data2.length;i++){
		data2[i] =  zeros(data[0].length);//fill the array with zeros
	}
	for(var i =0;i<data.length;i++){
		var i_dat = data[i];
		for(var j=0;j<i_dat.length;j++){
			data2[i][j] += parseFloat(data[i][j]);//store the array with the float of the actual digit
		}
	}
	

	return {rownames:rownames,
			colnames:colnames,
			data:data2};

}

//sum of an array
function sum(v){
	var sum = 0;

	for(var i =0;i<v.length;i++){
		sum +=v[i];
	}
	return sum;
}

function pearson(v1,v2){
	//calculate the pearson correlation
	var sum1 = sum(v1);
	var sum2 = sum(v2);
	var sum1sq,sum2sq,dat1=[],dat2=[];
	for(var v in v1){

		dat1.push(Math.pow(v1[v],2));//the square if each datapoint in v1
		
	}
	sum1sq = sum(dat1);//the sum of data1
	for(var v in v2){

		dat2.push(Math.pow(v2[v],2));
	}
	sum2sq = sum(dat2);
 	//console.log(sum1sq,sum2sq);
	var psum,pdata=[];

	for(var i in v1){
		pdata.push(v1[i]*v2[i]);//calc the product of v1 and v2
	}
	psum = sum(pdata);

	var num = psum - (sum1*sum2/v1.length); 
	var den = Math.sqrt((sum1sq-Math.pow(sum1,2)/v1.length)*(sum2sq-Math.pow(sum2,2)/v1.length));

	if(den==0) return 0;

	return 1.0-num/den;//normalize the result between 0 and 1

}

function bicluster(opt){
	//to store the state of data
	this.left = opt.left || null;
	this.right = opt.right || null;
	this.vec = opt.vec;
	this.id = opt.id || 0;
	this.distance = opt.distance || 0.0;
}


function len(a){//calculate the length of the object
	var len=0;

	for(var i in a){
		len++
	}
	return len;
}
function mergevecs(a,b){//merge two array 
	var mergdata = [];

	for(var i=0;i<a.length;i++){
		mergdata.push((a[i] + b[i])/2.0);
	}
	return mergdata;
}
function hcluster(rows,distance){
	//row=>data,distance =>pearson
	var distances = {};

	var currentclustid = -1;

	
	var clust = [];
	for(var i=0;i<rows.length;i++){

		clust.push(new bicluster({vec:rows[i],id:i}));//propagate an array with an object
	}
	
	//console.log(distance(clust[1].vec,clust[1].vec));
	var store=[];
	while(clust.length > 1){//loop until the lengt of the cluster array is greater than 1

		 let lowestpair= [0,1];//the lowest pair has index 0 and 1 if the array(i.e closest dist)


		 var closest =distance(clust[0].vec,clust[1].vec); 
		 //console.lo(clust);
		for(var i=0;i<clust.length;i++){
			for(var j=i+1; j<clust.length; j++ ){
				var y = clust[i].id+","+clust[j].id; //store the id has string for object property
				
				if(!( y in distances)){//store the distance
					distances[clust[i].id+","+clust[j].id]= distance(clust[i].vec,clust[j].vec);

				}
				var d = distances[clust[i].id+","+clust[j].id]

				if(d < closest){//choose the lowest distance and store the index
					closest = d;
					lowestpair[0] =i;
					lowestpair[1] =j;
				}
			}
		}

		var mergevec = mergevecs(clust[lowestpair[0]].vec,clust[lowestpair[1]].vec);


		var newcluster = new bicluster({vec:mergevec,left:clust[lowestpair[0]],
										right:clust[lowestpair[1]],
										distance:closest,id:currentclustid});
		
		currentclustid -=1;//decrease the cluster id
		//store.push("("+lowestpair[1]+","+lowestpair[0]+")")
		
		clust.splice(lowestpair[1],1);
		clust.splice(lowestpair[0],1);
		clust.push(newcluster);

		
		//lend--;
	}
	 
	return clust[0];
}
var l = [];
function v(n){
	//function to space the output properly
	var space =[];
	for(var i =0;i< n;i++){
		space.push(' ');
	}
	return space;
}
function printclust(clust,labels,n){
	var space = v(n).join('')
	if(clust.id < 0){//indicate a group
		console.log(space+'-');
	}
	else{
		console.log(space+labels[clust.id]);// the child
	}
	
	
	if(clust['left'] !=null){
		printclust(clust['left'],labels,n+1);
		
	}
	if(clust['right'] !=null){
		printclust(clust['right'],labels,n+1);
		
	}
}

var data = [[1.0,8.0],[3.0,8.0],[2.0,7.0],[1.5,1.0],[4.0,2.0]];
var file = readfile('bb.txt');
var labels=['A','B','C','D','E'];
var euclid = function(v1,v2){
	var sum=0;
	for(var i=0;i<v1.length;i++){
		sum+= Math.pow(v1[i]-v2[i],2);
	}
	return sum;
};
var clust = hcluster(file.data,pearson);
//var clust = hcluster(data,euclid);
//printclust(clust,file.labels,0);
printclust(clust,file.rownames,0);


