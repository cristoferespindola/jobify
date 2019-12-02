const express = require('express');
const app = express();

const path = require('path');
const sqlite = require('sqlite');
const dbConnection = sqlite.open(path.resolve(__dirname,'banco.sqlite'), { Promise });

const bodyParser =  require('body-parser');

const port = process.env.PORT || 3000;

app.use('/admin', (request, response, next) => {
  if(request.hostname === 'localhost') {
    next();
  } else {
    response.send('Not allowed');
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views/'));
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async(request, response) =>{
  const db = await dbConnection;
  const categoriasDb = await db.all('select * from categorias');
  const vagas = await db.all('select * from vagas');
  const dev = request.hostname === 'localhost' ? true : false;
  const categorias = categoriasDb.map(cat =>{
    return {
      ...cat,
      vagas: vagas.filter( vaga => vaga.categoria === cat.id )
    }
  })
  response.render('home', {
    categorias,
    dev
  });
});

app.get('/vaga/:id', async(request, response) =>{
  const db = await dbConnection;
  const vaga = await db.get(`select * from vagas where id =${request.params.id}`);
  response.render('vaga', {
    vaga
  });
});

app.get('/admin', (request, response) =>{
  response.render('admin/home');
});

app.get('/admin/vagas', async(request, response) => {
  const db = await dbConnection;
  const vagas = await db.all('SELECT * FROM vagas;');

  response.render('admin/vagas/home' ,{
    vagas
  })
});

app.get('/admin/vagas/deletar/:id', async(request, response) =>{
  const db = await dbConnection;
  await db.run(`DELETE FROM vagas WHERE id = ${request.params.id}`);
  response.redirect('/admin/vagas');
});

app.get('/admin/vagas/nova', async(request, response) =>{
  const db = await dbConnection;
  const categorias = await db.all(`SELECT * FROM categorias`);
  response.render('admin/vagas/new', {
    categorias
  });
});

app.get('/admin/vagas/editar/:id', async(request, response) =>{
  const db = await dbConnection;
  const vaga = await db.get(`SELECT * FROM vagas WHERE id = ${request.params.id}`)
  const categorias = await db.all(`SELECT * FROM categorias`);

  response.render('admin/vagas/edit', {
    categorias,
    vaga
  });
});

app.post('/admin/vagas/nova', async(request, response) =>{
  const db = await dbConnection;
  const { titulo, descricao, categoria } = request.body;

  await db.run(`insert INTO vagas(categoria, titulo, descricao)
                VALUES(${categoria}, '${titulo}', '${descricao}')`);
  response.redirect('/admin/vagas')
});

app.post('/admin/vagas/editar/:id', async(request, response) =>{
  const db = await dbConnection;
  const { titulo, descricao, categoria } = request.body;
  const { id } = request.params;

  await db.run(`UPDATE vagas SET categoria = ${categoria}, titulo= '${titulo}', descricao = '${descricao}'
                WHERE id = ${id}`);
  response.redirect('/admin/vagas')
});

app.get('/admin/categorias' , async(request, response) => {
  const db = await dbConnection;
  const categorias = await db.all('SELECT * FROM categorias');
  response.render('admin/categorias/home', {
    categorias
  })
});

app.get('/admin/categorias/nova', async(request, response) =>{
  const db = await dbConnection;
  response.render('admin/categorias/new');
});

app.post('/admin/categorias/nova', async(request, response) =>{
  const db = await dbConnection;
  const { nome } = request.body;

  await db.run(`insert INTO categorias(nome) VALUES('${nome}');`);
  response.redirect('/admin/categorias')
});

app.get('/admin/categorias/deletar/:id', async(request, response) =>{
  const db = await dbConnection;
  await db.run(`DELETE FROM categorias WHERE id = ${request.params.id}`);
  response.redirect('/admin/categorias');
});

app.get('/admin/categorias/editar/:id', async(request, response) =>{
  const db = await dbConnection;
  const categoria =  await db.get(`SELECT * FROM categorias WHERE id = ${request.params.id}`);

  response.render('admin/categorias/edit', { categoria });
});

app.post('/admin/categorias/editar/:id', async(request, response) =>{
  const db = await dbConnection;
  const { nome } = request.body;
  const { id } = request.params;

  await db.run(`UPDATE categorias SET nome = '${nome}'
                WHERE id = ${id}`);
  response.redirect('/admin/categorias')
});

const init = async() => {
  const db = await dbConnection;
  await db.run(`create table if not exists categorias (
    id INTEGER PRIMARY KEY,
    nome TEXT
    )`
  );
  await db.run(`create table if not exists vagas (
    id INTEGER PRIMARY KEY,
    categoria INTEGER,
    titulo TEXT,
    descricao TEXT
    )`
  );
  // await db.run(`ALTER TABLE vagas ADD descricao TEXT`)
  // const categoria = 'Digital Marketing (San Francisco)';
  // await db.run(`insert INTO categorias(name) VALUES('${categoria}')`);
  // const categoria2 = 'Engineering team';
  // await db.run(`insert INTO categorias(name) VALUES('${categoria2}')`);
  // const vaga = 'Digital Marketing (San Francisco)';
  // await db.run(`insert INTO vagas(categoria, titulo, descricao) VALUES(1, '${vaga}', 'Vaga para time de marketing')`);
  // await db.run(`UPDATE vagas SET categoria = 2 WHERE id = 1`)
  // await db.run(`UPDATE categorias SET name = 'Marketing team' WHERE id = 1`)
  // await db.run(`DELETE FROM vagas WHERE id = 3`)
}

init();

app.listen(port, ( err )=>{
  if(err) console.log('Erro ao inicializar o servidor');
  else console.log(`Servidor rodando na porta ${port}`);
});