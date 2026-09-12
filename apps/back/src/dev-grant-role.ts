import { connectDatabase } from './database.js';
import { SqlDatabase } from './shared/sql.js';
import { assertLocalAuthAllowed } from './modules/accounts/service.js';
assertLocalAuthAllowed(process.env);
const [rawEmail,role,mode]=process.argv.slice(2);
if(!rawEmail||!['admin','moderator'].includes(role??''))throw new Error('Uso: dev-grant-role correo admin|moderator (cuenta local ya registrada)');
const email=rawEmail.trim().toLowerCase();
const pool=await connectDatabase();
try{
  const db=new SqlDatabase(pool);
  await db.transaction(async tx=>{
    const account=(await tx.query<{id:string}>("SELECT LOWER(CONVERT(char(36),Id)) AS id FROM dbo.Accounts WITH (UPDLOCK,HOLDLOCK) WHERE Email=@email AND State='active'",{email}))[0];
    if(!account)throw new Error('No existe una cuenta local activa con ese correo');
    if(mode==='--revoke')await tx.query('DELETE dbo.AccountRoles WHERE AccountId=@id AND Role=@role; DELETE dbo.Sessions WHERE AccountId=@id',{id:account.id,role:role!});
    else {
      if(mode)throw new Error('Opción desconocida. Usa --revoke para retirar el rol');
      await tx.query('IF NOT EXISTS (SELECT 1 FROM dbo.AccountRoles WHERE AccountId=@id AND Role=@role) INSERT dbo.AccountRoles(AccountId,Role) VALUES(@id,@role)',{id:account.id,role:role!});
    }
    await tx.audit(account.id,mode==='--revoke'?'development.role_revoked':'development.role_granted',account.id,'Gestión explícita mediante CLI local: '+role);
  });
  console.log(mode==='--revoke'?'Rol local retirado y sesiones revocadas.':'Rol local asignado. Recarga el perfil para continuar.');
}finally{await pool.close();}
