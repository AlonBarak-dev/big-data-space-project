const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://35.234.119.103:9200',
  auth: {
    username: 'elastic',
    password: 'changeme'
  }
})

async function run() {
  await client.index({
    index: 'game-of-thrones',
    body: {
      character: 'Ned Stark',
    quote: 'Winter is coming.'
    }
  })

  await client.index({
    index: 'game-of-thrones',
    body: {
      character: 'Daenerys Targaryen',
    quote: 'I am the blood of the dragon.'
    }
  })

  await client.index({
    index: 'game-of-thrones',
    body: {
      character: 'Tyrion Lannister',
    quote: 'A mind needs books like a sword needs whetstone.'
    }
  })

  await client.indices.refresh({index: 'game-of-thrones'})
}

run().catch(console.log)
