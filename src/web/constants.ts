const EDITOR_FUNCTION_SOURCE_DEFAULT = `exports = function(arg){
    /*
      Accessing application's values:
      var x = context.values.get("value_name");
  
      Accessing a mongodb service:
      var collection = context.services.get("mongodb-atlas").db("dbname").collection("coll_name");
      collection.findOne({ owner_id: context.user.id }).then((doc) => {
        // do something with doc
      });
  
      To call other named functions:
      var result = context.functions.execute("function_name", arg1, arg2);
  
      Try running in the console below.
    */
    return {arg: arg};
  };`;
  

export const DEFAULT_RUNNER = `exports('Hello world!');`;
export const ATLAS_APP_SERVICES_CONFIG_NAME = 'atlasAppServices';