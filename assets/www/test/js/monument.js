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
	data.name = '#evil<name>[muh]h|a{hhh}oh:no/mr.bill'
	m4 = new WLMMobile.Monument( data );
	data.name = 'Аўгустоўскі канал:водны шлях, які ўключае зарэгуляваны ўчастак р. Чорная Ганча ад Дзяржаўнай граніцы з Рэспублікай Польшча да в. Сонічы (13км), штучны ўчастак канала ад в. Сонічы да шлюза«Нямнова» (6,5 км)гідравузел «Нямнова»: Гарадзенскі раён. Тэрыторыя ў межах матэрыяльнай нерухомайгісторыка-культурнай каштоўнасьці, устаноўленых праектам «Зоны аховы і рэжымыіх утрыманьня гісторыка-культурнай каштоўнасьці «Аўгустоўскі канал»';
	m5 = new WLMMobile.Monument( data );

	name = m.generateFilename();
	name2 = m2.generateFilename();
	name3 = m3.generateFilename();
	name4 = m4.generateFilename();
	name5 = m5.generateFilename();
	strictEqual( name.indexOf( 'hello - symbol' ), 0, 'the illegal symbol was escaped' );
	strictEqual( name2.indexOf( 'hello-?' ), 0, 'the illegal symbol was escaped' );
	strictEqual( name3.indexOf( '-hello-' ), 0, 'the illegal symbol was escaped' );
	strictEqual( name4.indexOf( '-evil-name--muh-h-a-hhh-oh-no-mr-bill' ), 0, 'the illegal symbols were escaped' );
	ok( name5.length < 240, 'long filenames are truncated with room to under 240 chars' ); // warning: actual limit lowered due to thumbnail problems
	strictEqual( name5.length, 71, 'long filenames are truncated for utf-8' ); // ideally this would convert to utf-8 and check the buffer length :)
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
