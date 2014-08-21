using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.DAL.Management
{
    //http://www.remondo.net/repository-pattern-example-csharp/

    //public partial class TS_03SetUpBrigades
    //{
    //    public TS_03SetUpBrigades(string turnId)
    //    {

    //    }
    //}

    public class TurnSheetRepository<T> where T : class, ITurnSheetEntity
    {
        internal DbSet<T> dbSet;
        private AusterlitzDbContext _austerlitzDbContext;

        public TurnSheetRepository(AusterlitzDbContext austerlitzDbContext)
        {
            this._austerlitzDbContext = austerlitzDbContext;
            this.dbSet = austerlitzDbContext.Set<T>();
        }

        public virtual IEnumerable<T> GetItems(Expression<Func<T, bool>> predicate)
        {
            return dbSet.Where(predicate).ToList<T>().AsQueryable();
        }

        public IEnumerable<T> GetItemsByTurnId(string turnId)
        {
            return dbSet.Where(e => e.TurnId.Equals(turnId)).ToList<T>().AsQueryable();
        }
        //http://stackoverflow.com/questions/4029493/update-existing-entitycollection-in-entity-framework
        public virtual IEnumerable<T> SaveRange(T[] entities)
        {
            IEnumerable<T> result;

            foreach (var entity in entities)
            {

                var original = GetItems((x => x.TurnId == entity.TurnId && x.OrderNo == entity.OrderNo)).Single();
                if (original != null)
                {
                    _austerlitzDbContext.Entry(original).CurrentValues.SetValues(entity);
                }
                else
                {
                    dbSet.Add(entity);
                    _austerlitzDbContext.Entry(entity).State = EntityState.Added;
                }
            }

            _austerlitzDbContext.SaveChanges();

            result = GetItemsByTurnId(entities[0].TurnId);

            return result;
        }

        public virtual void Update(T[] entities)
        {
            _austerlitzDbContext.Entry(entities).State = EntityState.Modified;
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

        public virtual T Insert(T entity)
        {
            var result = dbSet.Add(entity);
            _austerlitzDbContext.SaveChanges();
            return result;
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
