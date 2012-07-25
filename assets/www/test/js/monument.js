(function() {

module( 'monuments.js', {} );

test( 'generateFilename: . symbol', function() {
	var data = {
		lat: 4, lon: 4, name: 'hello . symbol', address: '29 Acacier Road'
	}, m, m2, m3, m4,
	name, name2, name3, name4;
	
	m = new WLMMobile.Monument( data );
	data.name = 'hello' + String.fromCharCode(27)+'?';
	m2 = new WLMMobile.Monument( data );
	data.name = '[hello]';
	m3 = new WLMMobile.Monument( data );
	data.name = '#evil<name>[muh]h|a{hhh}'
	m4 = new WLMMobile.Monument( data );

	name = m.generateFilename();
	name2 = m2.generateFilename();
	name3 = m3.generateFilename();
	name4 = m4.generateFilename();
console.log(name2, name2 === 'hello?')
	strictEqual( name.indexOf( 'hello - symbol' ), 0, 'the illegal symbol was escaped' );
	strictEqual( name2.indexOf( 'hello-?' ), 0, 'the illegal symbol was escaped' );
	strictEqual( name3.indexOf( '-hello-' ), 0, 'the illegal symbol was escaped' );
	strictEqual( name4.indexOf( '-evil-name--muh-h-a-hhh-' ), 0, 'the illegal symbols were escaped' );
});

test( 'randomness of monument names', function() {
	var d = new Date(),
		data = {
			lat: 4, lon: 4, name: 'hello . symbol', address: '29 Acacier Road'
		}, m, areDifferentNames,
		d2 = new Date( d - 1000 ); // second before

	m = new WLMMobile.Monument( data );
	areDifferentNames = m.generateFilename( d ) === m.generateFilename( d2 );
	strictEqual( areDifferentNames, false, 'ensure the names generated are unique' );
} );

}());
