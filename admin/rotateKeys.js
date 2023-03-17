import jose from 'node-jose';
import { SSMClient, PutParameterCommand} from "@aws-sdk/client-ssm";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const privateKeyPath = "/birdcount-api/dev/privateJWK"

const awsConfig = {
    region: "us-east-1"
}
const ssm_client = new SSMClient(awsConfig);
const s3_client = new S3Client(awsConfig);

const now = new Date();


function pruneKeys(jwks, now, ageLimit) {
    let keysToKeep = [];
    jwks.keys.forEach(k => {
        const createdAt = jwks.keyCreationTime[k];
        if(createdAt !== undefined && (now - createdAt) < ageLimit) {
            keysToKeep.push(jwks.keys[k]);
        } else {
            delete jwks.keyCreationTime[k];
        }
    });
        
    jwks.keys = keysToKeep;
}

let existingJWKS = { keyCreationTime: {},
    keys: []
};

try {
    const existingJWKSResponse = await s3_client.send(new GetObjectCommand({
        Bucket: "birdcount-api-storage",
        Key: "/birdcount-api/jwks.json",  
    }));

    existingJWKS = JSON.parse(await existingJWKSResponse.Body.transformToString());
} catch(e) {

}

pruneKeys(existingJWKS, now, 24*60*60);

let keystore;

if(!existingJWKS.keys.length === 0) {
    keystore = jose.JWK.createKeyStore();

} else {
    keystore = await jose.JWK.asKeyStore(existingJWKS);
}

const newKey = await keystore.generate("RSA", 2048);

const privateKey = newKey.toJSON(true);
const publicKeyStore = keystore.toJSON();

publicKeyStore.keyCreationTime = {};

if( existingJWKS && existingJWKS.keyCreationTime) {
    Object.assign(publicKeyStore.keyCreationTime, existingJWKS.keyCreationTime);
}

publicKeyStore.keyCreationTime[newKey.kid] = now.toISOString();


const ssm_command =  new PutParameterCommand({
    Name: "/birdcount-api/jwk",
    Value: JSON.stringify(privateKey),
    Overwrite: true,
    Type: "SecureString"
});

const s3_command = new PutObjectCommand({
    Bucket: "birdcount-api-storage",
    Key: "/birdcount-api/jwks.json",
    Body: JSON.stringify(publicKeyStore)
  });


 await s3_client.send(s3_command);
 await ssm_client.send(ssm_command);

 console.log(existingJWKS);
 console.log(publicKeyStore);






