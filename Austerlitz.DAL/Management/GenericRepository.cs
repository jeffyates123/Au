 using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Core.Objects;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.DAL.Management
{
    public class GenericRepository<T> where T : class, new()
    {
        internal DbSet<T> dbSet;

        public GenericRepository(AusterlitzDbContext austerlitzDbContext)
        {
            this.dbSet = austerlitzDbContext.Set<T>();
        }

        public virtual IEnumerable<T> GetItems(Expression<Func<T, bool>> predicate)
        {
            return dbSet.Where(predicate).ToList<T>().AsQueryable();
        }

        public virtual IEnumerable<T> InsertRange(T[] entities)
        {
            return dbSet.AddRange(entities);
        }

        public virtual IEnumerable<T> Get()
        {
            IQueryable<T> query = dbSet;
            return query.ToList();
        }

        public virtual T GetByID(object id)
        {
            return dbSet.Find(id);
        }

        public virtual void Insert(T entity)
        {
            dbSet.Add(entity);
        }

        public virtual void Delete(object id)
        {
            T entityToDelete = dbSet.Find(id);
            Delete(entityToDelete);
        }
        
        public virtual void Delete(T entityToDelete)
        {
            dbSet.Remove(entityToDelete);
        }


        //public virtual void DeleteRange(object id)
        //{
        //    TEntity[] entitiesToDelete = dbSet.Where(id);
        //    DeleteRange(entitiesToDelete);
        //}



        //public virtual void Update(T entityToUpdate)
        //{
        //    dbSet.Attach(entityToUpdate);
        //    context.Entry(entityToUpdate).State = EntityState.Modified;
        //}

        // REturn to this in the future?? I may be able to pass the parameters to call the constructor in some way using delegate function but right now... nah
        //public static IQueryable<T> CreateBlankTurnSheetSetUpBrigades(string turnId)
        //{
        //    var maxItems = 8;
        //    var TSItems = new T[maxItems];

        //    for (var itemCount = 1; itemCount <= maxItems; itemCount++)
        //    {
        //        ITurnSheetEntity x = (ITurnSheetEntity)Activator.CreateInstance(typeof(ITurnSheetEntity), new object[] { TurnId = turnId });

        //        TSItems[itemCount - 1] = (ITurnSheetEntity)Activator.CreateInstance(typeof(ITurnSheetEntity), new object[] { TurnId = turnId });

        //        var instance = Activator.CreateInstance(typeof(TS_03SetUpBrigades), new object[] { });

        //    }
        //            //new <T> { TurnId = turnId, OrderNo = itemCount };  // could make a factory here to create TS entities all with same interface as they all have turnid, orderno

        //    return TSItems.AsQueryable();
        //}
    }
}
