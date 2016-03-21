import RestSerializer from 'ember-cli-mirage/serializers/rest-serializer';
import { hasMany, belongsTo } from 'ember-cli-mirage';
import Schema from 'ember-cli-mirage/orm/schema';
import Model from 'ember-cli-mirage/orm/model';
import Db from 'ember-cli-mirage/db';
import SerializerRegistry from 'ember-cli-mirage/serializer-registry';
import { module, test } from 'qunit';

module('Integration | Serializer | RestSerializer', {
  beforeEach: function() {
    let db = new Db();
    this.schema = new Schema(db);
    this.schema.registerModels({
      wordSmith: Model.extend({
        blogPosts: hasMany()
      }),
      blogPost: Model.extend({
        wordSmith: belongsTo()
      })
    });

    let link = this.schema.wordSmith.create({name: 'Link', age: 123});
    link.createBlogPost({title: 'Lorem'});
    link.createBlogPost({title: 'Ipsum'});

    this.schema.wordSmith.create({name: 'Zelda', age: 230});

    this.registry = new SerializerRegistry(this.schema, {
      application: RestSerializer,
      wordSmith: RestSerializer.extend({
        attrs: ['id', 'name'],
        include: ['blogPosts']
      })
    });
  },

  afterEach() {
    this.schema.db.emptyData();
  }
});

test('it sideloads associations and camel-cases relationships and attributes correctly for a model', function(assert) {
  let link = this.schema.wordSmith.find(1);
  let result = this.registry.serialize(link);

  assert.deepEqual(result, {
    wordSmith: {
      id: '1',
      name: 'Link',
      blogPostIds: ['1', '2']
    },
    blogPosts: [
      {
        id: '1',
        title: 'Lorem',
        wordSmithId: '1'
      },
      {
        id: '2',
        title: 'Ipsum',
        wordSmithId: '1'
      }
    ]
  });
});
